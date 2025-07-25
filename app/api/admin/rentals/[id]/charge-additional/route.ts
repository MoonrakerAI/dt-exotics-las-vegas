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
    const { id } = await params;
    const body = await request.json();
    const { amount, memo } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
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

    // Get the original payment method from the deposit payment intent
    const originalPaymentIntent = await stripe.paymentIntents.retrieve(
      rental.payment.depositPaymentIntentId
    );

    if (!originalPaymentIntent.payment_method) {
      return NextResponse.json(
        { error: 'No payment method available for additional charges' },
        { status: 400 }
      );
    }

    // Create a new payment intent for the additional charge
    const additionalPaymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: rental.payment.stripeCustomerId,
      payment_method: originalPaymentIntent.payment_method as string,
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/bookings/${id}`,
      description: `Additional charge for rental ${id}: ${memo || 'Additional services'}`,
      metadata: {
        rentalId: id,
        type: 'additional_charge',
        memo: memo || 'Additional charge'
      }
    });

    if (additionalPaymentIntent.status === 'succeeded') {
      // Update rental with additional charge information
      const updatedRental = {
        ...rental,
        pricing: {
          ...rental.pricing,
          additionalCharges: (rental.pricing.additionalCharges || 0) + amount,
          finalAmount: rental.pricing.finalAmount + amount
        },
        payment: {
          ...rental.payment,
          additionalCharges: [
            ...(rental.payment.additionalCharges || []),
            {
              id: additionalPaymentIntent.id,
              amount: amount,
              memo: memo || 'Additional services',
              chargedAt: new Date().toISOString(),
              status: 'succeeded' as const
            }
          ]
        },
        updatedAt: new Date().toISOString()
      };

      await kvRentalDB.updateRental(id, updatedRental);

      return NextResponse.json({
        success: true,
        message: 'Additional charge processed successfully',
        data: {
          paymentIntentId: additionalPaymentIntent.id,
          amount: amount,
          status: additionalPaymentIntent.status,
          rental: updatedRental
        }
      });
    } else {
      return NextResponse.json(
        { error: `Payment failed with status: ${additionalPaymentIntent.status}` },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Additional charge error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: `Card error: ${error.message}` },
        { status: 400 }
      );
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: `Invalid request: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process additional charge' },
      { status: 500 }
    );
  }
}