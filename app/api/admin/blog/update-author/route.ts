import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, getEnrichedUser } from '@/app/lib/auth';
import blogDB from '@/app/lib/blog-database';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';

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

    // Get enriched user data with profile information
    const enrichedUser = await getEnrichedUser(user.userId);
    if (!enrichedUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get all blog posts
    const allPosts = await blogDB.getAllPosts();
    let updatedCount = 0;

    // Update each post with current admin's profile information
    for (const post of allPosts) {
      const updatedPost = await blogDB.updatePost(post.id, {
        author: {
          name: enrichedUser.name || 'Admin',
          email: enrichedUser.email || 'admin@dtexoticslv.com',
          avatar: enrichedUser.avatar,
          bio: enrichedUser.bio
        }
      });

      if (updatedPost) {
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} blog posts with current admin profile`,
      updatedCount,
      adminProfile: {
        name: enrichedUser.name,
        email: enrichedUser.email,
        avatar: enrichedUser.avatar,
        bio: enrichedUser.bio
      }
    });

  } catch (error) {
    console.error('Error updating blog author info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
