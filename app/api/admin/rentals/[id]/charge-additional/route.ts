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
    const { amount, memo, chargeNow = false } = body;

    // Allow negative amounts for discounts/refunds
    if (amount === undefined || amount === null || isNaN(amount)) {
      return NextResponse.json(
        { error: 'Valid amount is required (can be positive or negative)' },
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

    // Create adjustment record
    const adjustmentId = `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const adjustment: any = {
      id: adjustmentId,
      amount: amount,
      memo: memo || (amount > 0 ? 'Additional charge' : 'Discount/Refund'),
      createdAt: new Date().toISOString(),
      status: chargeNow ? 'pending' : 'manual' as const,
      type: amount > 0 ? 'charge' : 'credit' as const
    };

    // If chargeNow is true, attempt to process payment through Stripe
    if (chargeNow && amount > 0) {
      try {
        // Get the original payment method from the deposit payment intent
        const originalPaymentIntent = await stripe.paymentIntents.retrieve(
          rental.payment.depositPaymentIntentId
        );

        if (!originalPaymentIntent.payment_method) {
          return NextResponse.json(
            { error: 'No payment method available for automatic charging. Use manual adjustment instead.' },
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
          adjustment.status = 'succeeded';
          adjustment.stripePaymentIntentId = additionalPaymentIntent.id;
        } else {
          adjustment.status = 'failed';
          adjustment.error = `Payment failed with status: ${additionalPaymentIntent.status}`;
        }
      } catch (stripeError: any) {
        console.error('Stripe payment error:', stripeError);
        adjustment.status = 'failed';
        adjustment.error = stripeError.message || 'Payment processing failed';
      }
    }

    // Update rental with pricing adjustment (regardless of payment status)
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
          adjustment
        ]
      },
      updatedAt: new Date().toISOString()
    };

    await kvRentalDB.updateRental(id, updatedRental);

    return NextResponse.json({
      success: true,
      message: chargeNow 
        ? (adjustment.status === 'succeeded' ? 'Additional charge processed and paid successfully' : 'Pricing adjusted, but payment failed')
        : 'Pricing adjustment applied successfully',
      data: {
        adjustment,
        rental: updatedRental,
        newTotal: updatedRental.pricing.finalAmount
      }
    });

  } catch (error: any) {
    console.error('Pricing adjustment error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process pricing adjustment' },
      { status: 500 }
    );
  }
}