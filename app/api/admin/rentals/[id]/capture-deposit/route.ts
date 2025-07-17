import { NextRequest, NextResponse } from 'next/server';
import rentalDB from '@/app/lib/database';
import stripe from '@/app/lib/stripe';

// Simple admin authentication
function isAdminAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
  
  return authHeader === `Bearer ${adminToken}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { captureAmount } = await request.json();
    const { id } = await params;

    const rental = await rentalDB.getRental(id);
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Capture the deposit payment
    const paymentIntent = await stripe.paymentIntents.capture(
      rental.payment.depositPaymentIntentId,
      {
        amount_to_capture: captureAmount ? captureAmount * 100 : undefined
      }
    );

    // Update rental status
    await rentalDB.updateRental(id, {
      payment: {
        ...rental.payment,
        depositStatus: 'captured'
      },
      status: 'active'
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          amountCaptured: paymentIntent.amount_captured
        }
      }
    });

  } catch (error) {
    console.error('Error capturing deposit:', error);
    
    // Handle specific Stripe errors
    if (error instanceof Error && error.message.includes('payment_intent')) {
      return NextResponse.json(
        { error: 'Payment capture failed: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}