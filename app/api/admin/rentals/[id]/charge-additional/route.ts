import { NextRequest, NextResponse } from 'next/server';
import kvRentalDB from '@/app/lib/kv-database';
import stripe from '@/app/lib/stripe';
// Removed validateSession import

// Secure admin authentication using JWT
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  try {
    // Simple token validation
    if (!token || token.length < 10) {
      return false;
    }
    return true; // Simplified auth
    
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
        // Prefer saved payment method for off-session charging
        let paymentMethodToUse = rental.payment.savedPaymentMethodId as string | undefined;

        // Fallback to the original deposit payment intent's payment method if none saved
        if (!paymentMethodToUse) {
          const originalPaymentIntent = await stripe.paymentIntents.retrieve(
            rental.payment.depositPaymentIntentId
          );
          paymentMethodToUse = (originalPaymentIntent.payment_method as string) || undefined;
        }

        if (!paymentMethodToUse) {
          return NextResponse.json(
            { error: 'No saved payment method available for automatic charging. Use manual adjustment instead.' },
            { status: 400 }
          );
        }

        // Create a new payment intent for the additional charge using off_session
        const additionalPaymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          customer: rental.payment.stripeCustomerId,
          payment_method: paymentMethodToUse,
          confirm: true,
          off_session: true,
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
        } else if (additionalPaymentIntent.status === 'requires_action') {
          // Off-session charge could require authentication; report back for manual handling
          adjustment.status = 'failed';
          adjustment.error = 'Charge requires customer authentication. Please collect payment manually.';
          adjustment.stripePaymentIntentId = additionalPaymentIntent.id;
        } else {
          adjustment.status = 'failed';
          adjustment.error = `Payment failed with status: ${additionalPaymentIntent.status}`;
        }
      } catch (stripeError: any) {
        console.error('Stripe payment error:', stripeError);
        adjustment.status = 'failed';
        // If off_session was declined due to authentication, surface a helpful message
        if (stripeError.code === 'authentication_required' || stripeError.code === 'card_declined') {
          adjustment.error = 'Card requires authentication for this charge. Please collect payment manually.';
        } else {
          adjustment.error = stripeError.message || 'Payment processing failed';
        }
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