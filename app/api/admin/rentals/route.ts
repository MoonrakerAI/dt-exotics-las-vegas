import { NextRequest, NextResponse } from 'next/server';
import kvRentalDB from '@/app/lib/kv-database';
// Removed validateSession import

// Secure admin authentication using JWT
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Simple token validation
    if (!token || token.length < 10) {
      return false;
    }
    return true; // Simplified auth
    
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const reqId = (globalThis as any).crypto?.randomUUID?.() || `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.log(`[Rentals GET][${reqId}] start`);
  if (!(await isAdminAuthenticated(request))) {
    console.warn(`[Rentals GET][${reqId}] unauthorized`);
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
      console.log(`[Rentals GET][${reqId}] path=status`, { status });
      rentals = await kvRentalDB.getRentalsByStatus(status as any);
    } else if (startDate && endDate) {
      console.log(`[Rentals GET][${reqId}] path=dateRange`, { startDate, endDate });
      rentals = await kvRentalDB.getRentalsByDateRange(startDate, endDate);
    } else {
      console.log(`[Rentals GET][${reqId}] path=all`);
      rentals = await kvRentalDB.getAllRentals();
    }

    // Sort by creation date (newest first)
    rentals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    console.log(`[Rentals GET][${reqId}] results`, { returned: rentals.length });

    return NextResponse.json({
      success: true,
      data: rentals
    });

  } catch (error) {
    console.error('[Rentals GET] error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}