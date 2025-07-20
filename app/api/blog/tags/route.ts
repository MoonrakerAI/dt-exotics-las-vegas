import { NextResponse } from 'next/server';
import blogDB from '@/app/lib/blog-database';

export async function GET() {
  try {
    const tags = await blogDB.getAllTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Public tags GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 