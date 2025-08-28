import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import carDB from '@/app/lib/car-database';
import { validateCarId } from '@/app/lib/validation';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';
import { Car } from '@/app/data/cars';

function isKvConfigured() {
  const restUrl = process.env.VERCEL_KV_REST_API_URL || process.env.KV_REST_API_URL;
  const restToken = process.env.VERCEL_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;
  const urlOnly = process.env.KV_URL || process.env.REDIS_URL;
  return !!((restUrl && restToken) || urlOnly);
}

// GET: List all cars
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await adminApiRateLimiter.checkLimit(clientId);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    // Auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const user = await verifyJWT(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Fleet storage unavailable.' }, { status: 503 })
    }
    // List all cars
    try {
      const cars = await carDB.getAllCars();
      return NextResponse.json({ cars });
    } catch (e) {
      console.error('Fleet GET KV/read error:', e);
      return NextResponse.json(
        { error: 'Fleet storage unavailable', details: e instanceof Error ? e.message : 'Unknown KV error' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Fleet GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new car
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
    const user = await verifyJWT(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Fleet storage unavailable.' }, { status: 503 })
    }
    const body = await request.json();
    // Validate car ID
    const idValidation = validateCarId(body.id);
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error }, { status: 400 });
    }
    // Create car
    const car: Car = body;
    await carDB.createCar(car);
    return NextResponse.json({ car });
  } catch (error) {
    console.error('Fleet POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a car (expects ?id=carId)
export async function PUT(request: NextRequest) {
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
    const user = await verifyJWT(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Fleet storage unavailable.' }, { status: 503 })
    }
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('id');
    if (!carId) {
      return NextResponse.json({ error: 'Missing car ID' }, { status: 400 });
    }
    const body = await request.json();
    const updatedCar = await carDB.updateCar(carId, body);
    if (!updatedCar) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    return NextResponse.json({ car: updatedCar });
  } catch (error) {
    console.error('Fleet PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a car (expects ?id=carId)
export async function DELETE(request: NextRequest) {
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
    const user = await verifyJWT(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Fleet storage unavailable.' }, { status: 503 })
    }
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('id');
    if (!carId) {
      return NextResponse.json({ error: 'Missing car ID' }, { status: 400 });
    }
    const deleted = await carDB.deleteCar(carId);
    if (!deleted) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fleet DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 