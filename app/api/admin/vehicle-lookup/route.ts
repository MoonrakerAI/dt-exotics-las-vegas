import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import { vehicleAPI } from '@/app/lib/vehicle-api';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';

// GET: Lookup vehicle data by year, make, model
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
    const year = searchParams.get('year');
    const make = searchParams.get('make');
    const model = searchParams.get('model');

    if (!year || !make || !model) {
      return NextResponse.json({ 
        error: 'Missing required parameters: year, make, model' 
      }, { status: 400 });
    }

    // Validate year
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 1) {
      return NextResponse.json({ 
        error: 'Invalid year. Must be between 1990 and current year + 1' 
      }, { status: 400 });
    }

    // Validate make and model
    if (make.length < 2 || model.length < 2) {
      return NextResponse.json({ 
        error: 'Make and model must be at least 2 characters long' 
      }, { status: 400 });
    }

    // Perform vehicle lookup
    const result = await vehicleAPI.lookupVehicle(yearNum, make.trim(), model.trim());

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Vehicle data not found'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Vehicle lookup API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 