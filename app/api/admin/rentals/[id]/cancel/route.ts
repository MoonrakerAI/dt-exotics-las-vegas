import { NextRequest, NextResponse } from 'next/server';
import kvRentalDB from '@/app/lib/kv-database';
import { validateSession } from '@/app/lib/auth';

// Secure admin authentication using JWT
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const user = await validateSession(token);
    return user !== null && user.role === 'admin';
  } catch {
    return false;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { reason, refundAmount } = body;

    const rental = await kvRentalDB.getRental(id);
    
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    if (rental.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (rental.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed bookings' },
        { status: 400 }
      );
    }

    // Create updated rental object
    const updatedRental = {
      ...rental,
      status: 'cancelled' as const,
      cancellation: {
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'admin',
        reason: reason || 'Cancelled by admin',
        refundAmount: refundAmount || 0,
        refundProcessed: false
      },
      updatedAt: new Date().toISOString()
    };

    await kvRentalDB.updateRental(id, updatedRental);

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        rental: updatedRental,
        refundInfo: {
          shouldRefund: refundAmount > 0,
          refundAmount: refundAmount || 0,
          depositAmount: rental.pricing.depositAmount,
          finalAmount: rental.pricing.finalAmount
        }
      }
    });

  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}