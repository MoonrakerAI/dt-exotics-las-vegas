import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getEnrichedUser } from '@/app/lib/auth';
import blogDB from '@/app/lib/blog-database';
import { validateBlogPost } from '@/app/lib/validation';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let posts;
    
    if (search) {
      posts = await blogDB.searchPosts(search);
    } else if (status) {
      posts = await blogDB.getPostsByStatus(status);
    } else {
      posts = await blogDB.getAllPosts();
    }

    // Apply pagination
    const paginatedPosts = posts.slice(offset, offset + limit);
    const total = posts.length;

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
    console.error('Blog GET error:', error);
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
        avatar: enrichedUser?.avatar
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: postData.status === 'published' ? new Date().toISOString() : undefined
    });

    return NextResponse.json(newPost, { status: 201 });

  } catch (error) {
    console.error('Blog POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 