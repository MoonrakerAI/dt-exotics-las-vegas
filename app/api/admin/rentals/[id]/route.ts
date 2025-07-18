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

export async function GET(
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
    const { id } = await params;
    const rental = await kvRentalDB.getRental(id);
    
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Get payment intent details from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      rental.payment.depositPaymentIntentId
    );

    return NextResponse.json({
      success: true,
      data: {
        rental,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          captureMethod: paymentIntent.capture_method,
          paymentMethod: paymentIntent.payment_method
        }
      }
    });

  } catch (error) {
    console.error('Error fetching rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}