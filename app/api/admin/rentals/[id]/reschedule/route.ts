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
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const rental = await kvRentalDB.getRental(id);
    
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    if (rental.status === 'cancelled' || rental.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot reschedule cancelled or completed bookings' },
        { status: 400 }
      );
    }

    // Validate dates
    const newStartDate = new Date(startDate);
    const newEndDate = new Date(endDate);
    const now = new Date();

    if (newStartDate < now) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (newEndDate <= newStartDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Calculate new pricing based on new dates
    const totalDays = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const newSubtotal = rental.pricing.dailyRate * totalDays;
    const newDepositAmount = Math.round(newSubtotal * 0.3); // 30% deposit
    const newFinalAmount = newSubtotal;

    // Create updated rental object
    const updatedRental = {
      ...rental,
      rentalDates: {
        startDate: startDate,
        endDate: endDate
      },
      pricing: {
        ...rental.pricing,
        totalDays: totalDays,
        subtotal: newSubtotal,
        depositAmount: newDepositAmount,
        finalAmount: newFinalAmount
      },
      status: 'confirmed' as const, // Reset to confirmed after rescheduling
      updatedAt: new Date().toISOString(),
      rescheduleHistory: [
        ...(rental.rescheduleHistory || []),
        {
          previousStartDate: rental.rentalDates.startDate,
          previousEndDate: rental.rentalDates.endDate,
          newStartDate: startDate,
          newEndDate: endDate,
          reason: reason || 'Admin rescheduled',
          rescheduledAt: new Date().toISOString(),
          rescheduledBy: 'admin'
        }
      ]
    };

    await kvRentalDB.updateRental(id, updatedRental);

    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: {
        rental: updatedRental,
        pricingChange: {
          oldAmount: rental.pricing.finalAmount,
          newAmount: newFinalAmount,
          difference: newFinalAmount - rental.pricing.finalAmount
        }
      }
    });

  } catch (error: any) {
    console.error('Reschedule error:', error);
    return NextResponse.json(
      { error: 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}