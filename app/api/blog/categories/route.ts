import { NextResponse } from 'next/server';
import blogDB from '@/app/lib/blog-database';

export async function GET() {
  try {
    const categories = await blogDB.getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Public categories GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 