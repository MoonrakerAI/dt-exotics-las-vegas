import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getEnrichedUser } from '@/app/lib/auth';
import blogDB from '@/app/lib/blog-database';
import { validateBlogPost } from '@/app/lib/validation';
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
  return Boolean(
    env.VERCEL_KV_REST_API_TOKEN ||
      env.KV_REST_API_TOKEN ||
      env.KV_URL ||
      env.REDIS_URL
  );
}

export async function GET(request: NextRequest) {
  try {
    // Correlate logs per request
    const reqId = (globalThis as any).crypto?.randomUUID?.() || `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[Blog GET][${reqId}] start`);
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await adminApiRateLimiter.checkLimit(clientId);
    
    if (!rateLimitResult.success) {
      console.warn(`[Blog GET][${reqId}] rate limited`, { clientId });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[Blog GET][${reqId}] missing/invalid auth header`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      console.warn(`[Blog GET][${reqId}] JWT verification failed`);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.log(`[Blog GET][${reqId}] auth ok`, { userId: (user as any).userId || (user as any).id });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Ensure KV configured for blog storage (read-only allowed)
    if (!isKvConfigured()) {
      console.error(`[Blog GET][${reqId}] KV not configured`);
      return NextResponse.json({ error: 'KV is not configured. Blog storage unavailable.' }, { status: 503 })
    }

    let posts;
    
    if (search) {
      console.log(`[Blog GET][${reqId}] path=search`, { q: search });
      posts = await blogDB.searchPosts(search);
    } else if (status) {
      console.log(`[Blog GET][${reqId}] path=status`, { status });
      posts = await blogDB.getPostsByStatus(status);
    } else {
      console.log(`[Blog GET][${reqId}] path=all`);
      posts = await blogDB.getAllPosts();
    }

    // Apply pagination
    const paginatedPosts = posts.slice(offset, offset + limit);
    const total = posts.length;
    console.log(`[Blog GET][${reqId}] results`, { total, limit, offset, returned: paginatedPosts.length });

    return NextResponse.json({
      posts: paginatedPosts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('[Blog GET] error', error);
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

    // Ensure KV configured for blog storage
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Blog storage unavailable.' }, { status: 503 })
    }

    const body = await request.json();

    // Validate blog post data
    const validation = validateBlogPost(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const postData = validation.sanitizedValue;

    // Check if slug already exists
    const existingPost = await blogDB.getPostBySlug(postData.slug);
    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    // Get enriched user data for author info
    const enrichedUser = await getEnrichedUser(user.id);

    // Create the blog post
    const newPost = await blogDB.createPost({
      ...postData,
      id: crypto.randomUUID(),
      author: {
        name: enrichedUser?.name || user.name || 'Admin',
        email: user.email,
        avatar: enrichedUser?.avatar,
        bio: enrichedUser?.bio
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: postData.status === 'published' ? new Date().toISOString() : undefined
    });

    return NextResponse.json(newPost, { status: 201 });

  } catch (error) {
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Blog storage unavailable.' }, { status: 503 })
    }
    if (!isKvWriteCapable()) {
      return NextResponse.json({ error: 'KV is read-only. Write operations are unavailable.' }, { status: 503 })
    }
    console.error('Blog POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 