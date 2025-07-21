import { NextRequest, NextResponse } from 'next/server';
import carDB from '@/app/lib/car-database';
import { getClientIdentifier, apiRateLimiter } from '@/app/lib/rate-limit';

// GET: Get cars for public frontend
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await apiRateLimiter.checkLimit(clientId);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const showOnHomepage = searchParams.get('showOnHomepage') !== 'false'; // Default to true
    
    let cars;
    
    if (startDate && endDate) {
      // Get cars available for specific dates
      cars = await carDB.getAvailableCarsForDates(startDate, endDate, showOnHomepage);
    } else {
      // Get all cars (filtered by homepage visibility if requested)
      const allCars = await carDB.getAllCars();
      cars = showOnHomepage ? allCars.filter(car => car.showOnHomepage !== false) : allCars;
      // Also filter by general availability flag
      cars = cars.filter(car => car.available);
    }
    
    return NextResponse.json({ 
      cars,
      total: cars.length 
    });
    
  } catch (error) {
    console.error('Cars API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 