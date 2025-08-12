import { NextRequest, NextResponse } from 'next/server';
import carDB from '@/app/lib/car-database';
import { getClientIdentifier, apiRateLimiter } from '@/app/lib/rate-limit';

// Ensure this route runs on Node.js runtime and is always dynamic
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Simple in-memory cache (per server instance) to speed up repeated month lookups
// Keyed by `${carId}:${startDate}:${endDate}` and expires after CACHE_TTL_MS
type CacheEntry = { ts: number; availability: Record<string, { available: boolean; reason?: string; price?: number }> }
const AVAILABILITY_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// GET: Get car availability for customer calendar
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await apiRateLimiter.checkLimit(clientId);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('carId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!carId) {
      return NextResponse.json({ 
        error: 'Car ID is required' 
      }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Start date and end date are required' 
      }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format' 
      }, { status: 400 });
    }

    if (start > end) {
      return NextResponse.json({ 
        error: 'Start date must be before end date' 
      }, { status: 400 });
    }

    // Check if car exists and is visible on homepage
    const car = await carDB.getCar(carId);
    if (!car) {
      return NextResponse.json({ 
        error: 'Car not found' 
      }, { status: 404 });
    }

    if (!car.showOnHomepage || !car.available) {
      return NextResponse.json({ 
        error: 'Car not available for booking' 
      }, { status: 404 });
    }

    // Try cache first
    const cacheKey = `${carId}:${startDate}:${endDate}`
    const now = Date.now()
    const cached = AVAILABILITY_CACHE.get(cacheKey)
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        availability: cached.availability,
        car: {
          id: car.id,
          brand: car.brand,
          model: car.model,
          year: car.year,
          dailyRate: car.price.daily,
          weeklyRate: car.price.weekly
        },
        cached: true
      })
    }

    // OPTIMIZED: Use batch availability method for better performance
    const availability = await carDB.getCarAvailabilityBatch(carId, startDate, endDate);

    // Store in cache
    AVAILABILITY_CACHE.set(cacheKey, { ts: now, availability })

    return NextResponse.json({
      success: true,
      availability,
      car: {
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        dailyRate: car.price.daily,
        weeklyRate: car.price.weekly
      }
    });

  } catch (error) {
    console.error('Car availability API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 