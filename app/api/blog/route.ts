import { NextRequest, NextResponse } from 'next/server';
import blogDB from '@/app/lib/blog-database';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let posts;
    
    if (search) {
      posts = await blogDB.searchPosts(search);
      // Filter to only published posts
      posts = posts.filter(post => post.status === 'published');
    } else if (category) {
      posts = await blogDB.getPostsByCategory(category);
    } else if (tag) {
      posts = await blogDB.getPostsByTag(tag);
    } else {
      posts = await blogDB.getPublishedPosts();
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
    console.error('Public blog GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 