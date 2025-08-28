import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import carDB from '@/app/lib/car-database';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';

function isKvConfigured() {
  const restUrl = process.env.VERCEL_KV_REST_API_URL || process.env.KV_REST_API_URL;
  const restToken = process.env.VERCEL_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;
  const urlOnly = process.env.KV_URL || process.env.REDIS_URL;
  return !!((restUrl && restToken) || urlOnly);
}

// GET: Get unavailable dates for a car
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('id');
    if (!carId) {
      return NextResponse.json({ error: 'Missing car ID' }, { status: 400 });
    }
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Availability storage unavailable.' }, { status: 503 })
    }
    const unavailableDates = await carDB.getCarAvailability(carId);
    return NextResponse.json({ unavailableDates });
  } catch (error) {
    console.error('Availability GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Set unavailable dates for a car
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
    const { id, unavailableDates } = body;
    if (!id || !Array.isArray(unavailableDates)) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Availability storage unavailable.' }, { status: 503 })
    }
    await carDB.setCarAvailability(id, unavailableDates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Availability POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
 