import { NextRequest, NextResponse } from 'next/server';
import carDB from '@/app/lib/car-database';
import { getClientIdentifier, apiRateLimiter } from '@/app/lib/rate-limit';

// GET: Get cars for public frontend
export async function GET(request: NextRequest) {
  try {
    const reqId = (globalThis as any).crypto?.randomUUID?.() || `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await apiRateLimiter.checkLimit(clientId);
    if (!rateLimitResult.success) {
      console.warn(`[Cars GET][${reqId}] rate limited`, { clientId });
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const showOnHomepage = searchParams.get('showOnHomepage') !== 'false'; // Default to true
    console.log(`[Cars GET][${reqId}] params`, { startDate, endDate, showOnHomepage });
    
    let cars;
    
    if (startDate && endDate) {
      // Get cars available for specific dates
      cars = await carDB.getAvailableCarsForDates(startDate, endDate, showOnHomepage);
      console.log(`[Cars GET][${reqId}] availableForDates`, { returned: cars.length });
    } else {
      // Get all cars (filtered by homepage visibility if requested)
      const allCars = await carDB.getAllCars();
      const filteredHomepage = showOnHomepage ? allCars.filter(car => car.showOnHomepage !== false) : allCars;
      // Treat undefined availability as available (backward compatibility)
      cars = filteredHomepage.filter(car => car.available !== false);
      console.log(`[Cars GET][${reqId}] all/no-dates`, { all: allCars.length, homepage: filteredHomepage.length, available: cars.length });
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
 