import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Get all blog post IDs
    const postIds = await kv.smembers('blog:posts:all');
    
    // Get all blog posts
    const posts = await Promise.all(
      postIds.map(async (id: string) => {
        const post = await kv.get(`blog:post:${id}`);
        return { id, ...post };
      })
    );

    // Get all blog-related keys
    const blogKeys = await kv.keys('blog:*');
    
    // Get all blog categories
    const categories = await kv.smembers('blog:categories:all');
    
    // Get all blog tags
    const tags = await kv.smembers('blog:tags:all');

    return NextResponse.json({
      success: true,
      postIds,
      posts: posts.filter(post => post.id), // Filter out null/undefined
      blogKeys,
      categories,
      tags,
      counts: {
        posts: posts.length,
        categories: categories.length,
        tags: tags.length
      }
    });
  } catch (error) {
    console.error('Debug blogs error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch blog data'
      },
      { status: 500 }
    );
  }
}
