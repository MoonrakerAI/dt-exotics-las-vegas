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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const rental = await kvRentalDB.getRental(id);
    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    if (rental.status === 'cancelled' || rental.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot confirm cancelled or completed bookings' },
        { status: 400 }
      );
    }

    if (rental.status === 'confirmed') {
      return NextResponse.json({ success: true, data: { rental } });
    }

    // Update rental with confirmed status
    const updatedRental = {
      ...rental,
      status: 'confirmed' as const,
      updatedAt: new Date().toISOString()
    };

    const updated = await kvRentalDB.updateRental(id, updatedRental);

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: {
        rental: updated
      }
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
