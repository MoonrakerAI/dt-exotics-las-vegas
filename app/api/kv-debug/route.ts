import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Log environment variables (without sensitive values)
    const envInfo = {
      KV_REST_API_URL: process.env.KV_REST_API_URL ? 'set' : 'not set',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'set' : 'not set',
      VERCEL_KV_REST_API_URL: process.env.VERCEL_KV_REST_API_URL ? 'set' : 'not set',
      VERCEL_KV_REST_API_TOKEN: process.env.VERCEL_KV_REST_API_TOKEN ? 'set' : 'not set',
      KV_URL: process.env.KV_URL ? 'set' : 'not set',
      REDIS_URL: process.env.REDIS_URL ? 'set' : 'not set',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV || 'development'
    };

    console.log('Environment Info:', JSON.stringify(envInfo, null, 2));

    // Test KV connection
    const testKey = 'kv-test-key';
    const testValue = { timestamp: new Date().toISOString(), status: 'test' };
    
    console.log('Testing KV set operation...');
    await kv.set(testKey, testValue);
    
    console.log('Testing KV get operation...');
    const retrievedValue = await kv.get(testKey);
    
    // Try to list keys (this might be restricted in some KV plans)
    let keys = [];
    try {
      console.log('Attempting to list keys...');
      // This might not work in all KV plans
      keys = await kv.keys('*');
    } catch (error) {
      console.warn('Could not list keys (this might be expected):', error);
    }

    return NextResponse.json({
      success: true,
      env: envInfo,
      kvTest: {
        set: 'success',
        get: retrievedValue,
        keys: keys.length > 0 ? keys : 'Key listing not available or restricted'
      },
      message: 'KV store connection successful',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('KV Debug Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'set' : 'not set',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'set' : 'not set',
        VERCEL_KV_REST_API_URL: process.env.VERCEL_KV_REST_API_URL ? 'set' : 'not set',
        VERCEL_KV_REST_API_TOKEN: process.env.VERCEL_KV_REST_API_TOKEN ? 'set' : 'not set',
        KV_URL: process.env.KV_URL ? 'set' : 'not set',
        REDIS_URL: process.env.REDIS_URL ? 'set' : 'not set',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV || 'development'
      },
      message: 'KV store connection failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
