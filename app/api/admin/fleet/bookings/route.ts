import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import kvRentalDB from '@/app/lib/kv-database';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';

// GET: Get rental bookings for a car
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
    const carId = searchParams.get('carId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!carId) {
      return NextResponse.json({ error: 'Missing car ID' }, { status: 400 });
    }
    
    // Get all rentals for date range or all rentals
    let allRentals;
    if (startDate && endDate) {
      allRentals = await kvRentalDB.getRentalsByDateRange(startDate, endDate);
    } else {
      allRentals = await kvRentalDB.getAllRentals();
    }
    
    // Filter by car ID and exclude cancelled bookings
    const carBookings = allRentals.filter(rental => 
      rental.carId === carId && 
      rental.status !== 'cancelled'
    );
    
    // Transform bookings into date ranges for the calendar
    const bookingDates = carBookings.flatMap(booking => {
      const startDate = new Date(booking.rentalDates.startDate);
      const endDate = new Date(booking.rentalDates.endDate);
      const dates = [];
      
      // Generate all dates in the booking range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    });
    
    // Remove duplicates
    const uniqueBookingDates = [...new Set(bookingDates)];
    
    // Return booking info with customer details for reference
    const bookingInfo = carBookings.map(booking => ({
      id: booking.id,
      startDate: booking.rentalDates.startDate,
      endDate: booking.rentalDates.endDate,
      customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
      status: booking.status
    }));
    
    return NextResponse.json({ 
      bookedDates: uniqueBookingDates,
      bookings: bookingInfo
    });
    
  } catch (error) {
    console.error('Fleet bookings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 