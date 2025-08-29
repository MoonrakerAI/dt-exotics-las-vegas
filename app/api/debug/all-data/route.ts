import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Get all keys
    const allKeys = await kv.keys('*');
    
    // Categorize keys
    const carKeys = allKeys.filter(key => key.startsWith('car:'));
    const invoiceKeys = allKeys.filter(key => key.startsWith('invoice:'));
    const blogKeys = allKeys.filter(key => key.startsWith('blog:'));
    const otherKeys = allKeys.filter(
      key => !key.startsWith('car:') && !key.startsWith('invoice:') && !key.startsWith('blog:')
    );

    // Get sample data (first 3 of each type to avoid too much data)
    const sampleCarData = await Promise.all(
      carKeys.slice(0, 3).map(async key => ({
        key,
        value: await kv.get(key)
      }))
    );

    const sampleInvoiceData = await Promise.all(
      invoiceKeys.slice(0, 3).map(async key => ({
        key,
        value: await kv.get(key)
      }))
    );

    const sampleBlogData = await Promise.all(
      blogKeys.slice(0, 3).map(async key => ({
        key,
        value: await kv.get(key)
      }))
    );

    return NextResponse.json({
      success: true,
      keyCounts: {
        total: allKeys.length,
        cars: carKeys.length,
        invoices: invoiceKeys.length,
        blogs: blogKeys.length,
        others: otherKeys.length
      },
      sampleData: {
        cars: sampleCarData,
        invoices: sampleInvoiceData,
        blogs: sampleBlogData
      },
      allKeys: allKeys.slice(0, 50) // First 50 keys
    });
  } catch (error) {
    console.error('Debug all-data error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch KV store data'
      },
      { status: 500 }
    );
  }
}
