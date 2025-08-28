import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import blogDB from '@/app/lib/blog-database';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';

function isKvConfigured() {
  const env = process.env as Record<string, string | undefined>;
  const hasRest =
    (env.VERCEL_KV_REST_API_URL || env.KV_REST_API_URL) &&
    (env.VERCEL_KV_REST_API_TOKEN || env.KV_REST_API_TOKEN || env.VERCEL_KV_REST_API_READ_ONLY_TOKEN || env.KV_REST_API_READ_ONLY_TOKEN);
  const hasUrl = env.KV_URL || env.REDIS_URL;
  return Boolean(hasRest || hasUrl);
}

function isKvWriteCapable() {
  const env = process.env as Record<string, string | undefined>;
  return Boolean(env.VERCEL_KV_REST_API_TOKEN || env.KV_REST_API_TOKEN || env.KV_URL || env.REDIS_URL);
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await adminApiRateLimiter.checkLimit(clientId);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Ensure KV configured (read-only allowed for GET)
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Blog storage unavailable.' }, { status: 503 })
    }
    // Get all tags
    const tags = await blogDB.getAllTags();

    return NextResponse.json(tags);

  } catch (error) {
    console.error('Tags GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await adminApiRateLimiter.checkLimit(clientId);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Ensure KV configured
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Blog storage unavailable.' }, { status: 503 })
    }

    const body = await request.json();

    // Validate tag data
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Tag name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (name.length > 30) {
      return NextResponse.json(
        { error: 'Tag name is too long (max 30 characters)' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Check if tag already exists
    const existingTags = await blogDB.getAllTags();
    const existingTag = existingTags.find(tag => tag.slug === slug);
    if (existingTag) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 409 }
      );
    }

    // Create the tag
    const newTag = await blogDB.createTag({
      id: crypto.randomUUID(),
      name: name,
      slug: slug,
      postCount: 0
    });

    // Update post counts after creating new tag
    await blogDB.updateTagCounts();

    return NextResponse.json(newTag, { status: 201 });

  } catch (error) {
    console.error('Tags POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 