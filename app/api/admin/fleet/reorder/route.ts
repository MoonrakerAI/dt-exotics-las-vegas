import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import carDB from '@/app/lib/car-database';

function isKvConfigured() {
  try {
    // Check for environment variables
    const hasRestConfig = (
      (process.env.VERCEL_KV_REST_API_URL || process.env.KV_REST_API_URL) &&
      (process.env.VERCEL_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || 
       process.env.VERCEL_KV_REST_API_READ_ONLY_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN)
    );
    
    const hasUrlConfig = process.env.KV_URL || process.env.REDIS_URL;
    
    return hasRestConfig || hasUrlConfig;
  } catch (error) {
    console.error('Error checking KV configuration:', error);
    return false;
  }
}

function isKvWriteCapable() {
  try {
    return !!(
      process.env.VERCEL_KV_REST_API_TOKEN ||
      process.env.KV_REST_API_TOKEN ||
      process.env.KV_URL ||
      process.env.REDIS_URL
    );
  } catch (error) {
    console.error('Error checking KV write capability:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Fleet storage unavailable.' }, { status: 503 })
    }
    if (!isKvWriteCapable()) {
      return NextResponse.json({ error: 'KV is read-only. Write operations are disabled.' }, { status: 503 })
    }

    const body = await request.json();
    const { carOrders } = body;

    if (!Array.isArray(carOrders)) {
      return NextResponse.json({ error: 'carOrders must be an array' }, { status: 400 });
    }

    // Validate the structure of carOrders
    for (const order of carOrders) {
      if (!order.carId || typeof order.displayOrder !== 'number') {
        return NextResponse.json({ 
          error: 'Each order must have carId (string) and displayOrder (number)' 
        }, { status: 400 });
      }
    }

    // Update car display orders in database
    await carDB.updateCarDisplayOrders(carOrders);

    return NextResponse.json({ 
      success: true,
      message: 'Car display order updated successfully'
    });

  } catch (error) {
    console.error('Error updating car display order:', error);
    return NextResponse.json({ 
      error: 'Failed to update car display order' 
    }, { status: 500 });
  }
}
