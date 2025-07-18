import { NextRequest, NextResponse } from 'next/server';
import kvRentalDB from '@/app/lib/kv-database';
import stripe from '@/app/lib/stripe';

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

    const rental = await kvRentalDB.getRental(id);
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
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          amountCapturable: paymentIntent.amount_capturable
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