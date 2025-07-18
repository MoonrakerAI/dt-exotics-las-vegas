import { NextRequest, NextResponse } from 'next/server';
import kvRentalDB from '@/app/lib/kv-database';

// Simple admin authentication - check for valid admin session token
function isAdminAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  // Allow both the new session tokens and the legacy admin token
  const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
  if (token === adminToken) {
    return true;
  }
  
  // Validate session token format (our tokens are base64 encoded)
  try {
    const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());
    return sessionData.user && sessionData.user.role === 'admin' && sessionData.expires > Date.now();
  } catch {
    return false;
  }
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
      rentals = await kvRentalDB.getRentalsByStatus(status as any);
    } else if (startDate && endDate) {
      rentals = await kvRentalDB.getRentalsByDateRange(startDate, endDate);
    } else {
      rentals = await kvRentalDB.getAllRentals();
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