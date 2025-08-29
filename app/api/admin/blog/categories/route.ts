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
    const reqId = (globalThis as any).crypto?.randomUUID?.() || `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[Blog Categories GET][${reqId}] start`);
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await adminApiRateLimiter.checkLimit(clientId);
    
    if (!rateLimitResult.success) {
      console.warn(`[Blog Categories GET][${reqId}] rate limited`, { clientId });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[Blog Categories GET][${reqId}] missing/invalid auth header`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      console.warn(`[Blog Categories GET][${reqId}] JWT verification failed`);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.log(`[Blog Categories GET][${reqId}] auth ok`, { userId: (user as any).userId || (user as any).id });

    // Ensure KV configured (read-only allowed)
    if (!isKvConfigured()) {
      console.error(`[Blog Categories GET][${reqId}] KV not configured`);
      return NextResponse.json({ error: 'KV is not configured. Blog storage unavailable.' }, { status: 503 })
    }

    // Get all categories
    const categories = await blogDB.getAllCategories();
    console.log(`[Blog Categories GET][${reqId}] results`, { returned: categories.length });

    return NextResponse.json(categories);

  } catch (error) {
    console.error('[Blog Categories GET] error', error);
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

    // Validate category data
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Category name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: 'Category name is too long (max 50 characters)' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Check if category already exists
    const existingCategories = await blogDB.getAllCategories();
    const existingCategory = existingCategories.find(cat => cat.slug === slug);
    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Create the category
    const newCategory = await blogDB.createCategory({
      id: crypto.randomUUID(),
      name: name,
      slug: slug,
      description: body.description || '',
      postCount: 0
    });

    // Update post counts after creating new category
    await blogDB.updateCategoryCounts();

    return NextResponse.json(newCategory, { status: 201 });

  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 