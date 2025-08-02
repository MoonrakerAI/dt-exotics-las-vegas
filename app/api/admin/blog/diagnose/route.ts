import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import blogDB from '@/app/lib/blog-database';
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

    // Get all blog posts and check for data integrity issues
    const allPosts = await blogDB.getAllPosts();
    const issues: any[] = [];

    for (const post of allPosts) {
      const postIssues: string[] = [];

      // Check required fields
      if (!post.id) postIssues.push('Missing id');
      if (!post.title) postIssues.push('Missing title');
      if (!post.slug) postIssues.push('Missing slug');
      if (!post.content) postIssues.push('Missing content');
      if (!post.createdAt) postIssues.push('Missing createdAt');
      if (!post.updatedAt) postIssues.push('Missing updatedAt');

      // Check author object
      if (!post.author) {
        postIssues.push('Missing author object');
      } else {
        if (!post.author.name) postIssues.push('Missing author.name');
        if (!post.author.email) postIssues.push('Missing author.email');
      }

      // Check SEO object
      if (!post.seo) {
        postIssues.push('Missing seo object');
      } else {
        if (!post.seo.metaTitle) postIssues.push('Missing seo.metaTitle');
        if (!post.seo.metaDescription) postIssues.push('Missing seo.metaDescription');
        if (!Array.isArray(post.seo.keywords)) postIssues.push('Invalid seo.keywords (not array)');
        if (!post.seo.ogTitle) postIssues.push('Missing seo.ogTitle');
        if (!post.seo.ogDescription) postIssues.push('Missing seo.ogDescription');
        if (typeof post.seo.noIndex !== 'boolean') postIssues.push('Invalid seo.noIndex (not boolean)');
        if (typeof post.seo.noFollow !== 'boolean') postIssues.push('Invalid seo.noFollow (not boolean)');
      }

      // Check arrays
      if (!Array.isArray(post.categories)) postIssues.push('Invalid categories (not array)');
      if (!Array.isArray(post.tags)) postIssues.push('Invalid tags (not array)');

      // Check status
      if (!['draft', 'published', 'archived', 'scheduled'].includes(post.status)) {
        postIssues.push(`Invalid status: ${post.status}`);
      }

      if (postIssues.length > 0) {
        issues.push({
          postId: post.id,
          title: post.title || 'Unknown Title',
          slug: post.slug || 'unknown-slug',
          status: post.status || 'unknown',
          issues: postIssues
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalPosts: allPosts.length,
      postsWithIssues: issues.length,
      issues: issues
    });

  } catch (error) {
    console.error('Error diagnosing blog data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
