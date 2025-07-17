import { NextRequest, NextResponse } from 'next/server';
import rentalDB from '@/app/lib/database';
import stripe from '@/app/lib/stripe';

// Simple admin authentication
function isAdminAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-token';
  
  return authHeader === `Bearer ${adminToken}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const rental = await rentalDB.getRental(params.id);
    
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
          paymentMethod: paymentIntent.payment_method,
          charges: paymentIntent.charges.data.map(charge => ({
            id: charge.id,
            status: charge.status,
            captureDeadline: charge.payment_method_details?.card?.capture_before
          }))
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