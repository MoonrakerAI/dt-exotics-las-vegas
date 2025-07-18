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