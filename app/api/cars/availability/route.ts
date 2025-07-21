import { NextRequest, NextResponse } from 'next/server';
import carDB from '@/app/lib/car-database';
import { getClientIdentifier, apiRateLimiter } from '@/app/lib/rate-limit';

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

    // Generate availability data for the date range
    const availability: { [date: string]: { available: boolean; reason?: string; price?: number } } = {};
    
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      // Check if this specific date is available
      const availabilityCheck = await carDB.isCarAvailableForRental(carId, dateStr, dateStr);
      
      availability[dateStr] = {
        available: availabilityCheck.available,
        reason: !availabilityCheck.available ? (
          availabilityCheck.conflicts.bookingConflicts ? 'Already booked' :
          availabilityCheck.conflicts.customBlocks.length > 0 ? 'Not available' :
          'Car unavailable'
        ) : undefined,
        price: car.price.daily // Include daily rate for pricing calculations
      };
      
      current.setDate(current.getDate() + 1);
    }

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