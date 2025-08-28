import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Test KV connection by setting a test key
    await kv.set('test-connection', 'success');
    const testValue = await kv.get('test-connection');
    
    return NextResponse.json({
      success: true,
      testValue,
      env: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'set' : 'not set',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'set' : 'not set',
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error('KV Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'set' : 'not set',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'set' : 'not set',
        NODE_ENV: process.env.NODE_ENV,
      }
    }, { status: 500 });
  }
}
