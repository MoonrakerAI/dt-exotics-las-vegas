import { NextRequest, NextResponse } from 'next/server';
import kvRentalDB from '@/app/lib/kv-database';

// Simple admin authentication - check for valid admin session token
function isAdminAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  // Allow the legacy admin token
  const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
  if (token === adminToken) {
    return true;
  }
  
  // Validate the simple auth token format (base64 encoded timestamp-userid-identifier)
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const parts = decoded.split('-');
    
    // Expected format: timestamp-userid-dt-exotics
    if (parts.length === 3 && parts[2] === 'dt-exotics') {
      const timestamp = parseInt(parts[0]);
      const userId = parts[1];
      
      // Check if token is not too old (24 hours)
      const tokenAge = Date.now() - timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      return tokenAge < maxAge && userId === '1'; // Admin user ID is '1'
    }
    
    return false;
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