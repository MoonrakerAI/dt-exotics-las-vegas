import { NextRequest, NextResponse } from 'next/server';
import kvRentalDB from '@/app/lib/kv-database';
import stripe from '@/app/lib/stripe';
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
    const { captureAmount } = await request.json();
    const { id } = await params;

    const rental = await kvRentalDB.getRental(id);
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Validate capture amount
    if (captureAmount && (captureAmount <= 0 || captureAmount > rental.pricing.depositAmount)) {
      return NextResponse.json(
        { error: 'Invalid capture amount' },
        { status: 400 }
      );
    }

    // Get the payment intent to validate its status
    const paymentIntent = await stripe.paymentIntents.retrieve(
      rental.payment.depositPaymentIntentId
    );

    if (paymentIntent.status !== 'requires_capture') {
      return NextResponse.json(
        { error: 'Payment intent is not in a capturable state' },
        { status: 400 }
      );
    }

    // Capture the deposit payment with idempotency key
    const idempotencyKey = `capture_${rental.id}_${Date.now()}`;
    const capturedPaymentIntent = await stripe.paymentIntents.capture(
      rental.payment.depositPaymentIntentId,
      {
        amount_to_capture: captureAmount ? captureAmount * 100 : undefined
      },
      {
        idempotencyKey
      }
    );

    // Update rental status
    await kvRentalDB.updateRental(id, {
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
          id: capturedPaymentIntent.id,
          status: capturedPaymentIntent.status,
          amount: capturedPaymentIntent.amount,
          amountCapturable: capturedPaymentIntent.amount_capturable
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