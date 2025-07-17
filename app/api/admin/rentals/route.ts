import { NextRequest, NextResponse } from 'next/server';
import rentalDB from '@/app/lib/database';

// Simple admin authentication - in production, use proper JWT or session management
function isAdminAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
  
  return authHeader === `Bearer ${adminToken}`;
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let rentals;

    if (status) {
      rentals = await rentalDB.getRentalsByStatus(status as any);
    } else if (startDate && endDate) {
      rentals = await rentalDB.getRentalsByDateRange(startDate, endDate);
    } else {
      rentals = await rentalDB.getAllRentals();
    }

    // Sort by creation date (newest first)
    rentals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: rentals
    });

  } catch (error) {
    console.error('Error fetching rentals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}