import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import carDB from '@/app/lib/car-database';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';

function isKvConfigured() {
  const restUrl = process.env.VERCEL_KV_REST_API_URL || process.env.KV_REST_API_URL;
  const restToken = process.env.VERCEL_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || process.env.VERCEL_KV_REST_API_READ_ONLY_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;
  const urlOnly = process.env.KV_URL || process.env.REDIS_URL;
  return !!((restUrl && restToken) || urlOnly);
}

function isKvWriteCapable() {
  return !!(
    process.env.VERCEL_KV_REST_API_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.KV_URL ||
    process.env.REDIS_URL
  );
}

// POST: Toggle homepage visibility for a car
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await adminApiRateLimiter.checkLimit(clientId);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const body = await request.json();
    const { id, showOnHomepage } = body;
    if (!id || typeof showOnHomepage !== 'boolean') {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Fleet storage unavailable.' }, { status: 503 })
    }
    if (!isKvWriteCapable()) {
      return NextResponse.json({ error: 'KV is read-only. Write operations are disabled.' }, { status: 503 })
    }
    const updatedCar = await carDB.setShowOnHomepage(id, showOnHomepage);
    if (!updatedCar) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    return NextResponse.json({ car: updatedCar });
  } catch (error) {
    console.error('Visibility POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
 