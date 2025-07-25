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

export async function GET(
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