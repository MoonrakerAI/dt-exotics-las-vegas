import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import { vehicleAPI } from '@/app/lib/vehicle-api';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';

// GET: Get vehicle suggestions for autocomplete
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await adminApiRateLimiter.checkLimit(clientId);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const make = searchParams.get('make');
    const model = searchParams.get('model');

    if (!make || make.length < 2) {
      return NextResponse.json({ 
        error: 'Make parameter is required and must be at least 2 characters' 
      }, { status: 400 });
    }

    // Get vehicle suggestions
    const suggestions = await vehicleAPI.getVehicleSuggestions(make.trim(), model?.trim());

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Vehicle suggestions API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 