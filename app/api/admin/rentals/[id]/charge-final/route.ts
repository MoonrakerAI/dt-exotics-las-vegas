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
    const { finalAmount, additionalCharges } = await request.json();
    const { id } = await params;

    const rental = await rentalDB.getRental(id);
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Get the customer's saved payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: rental.stripeCustomerId,
      type: 'card'
    });

    if (paymentMethods.data.length === 0) {
      return NextResponse.json(
        { error: 'No saved payment method found' },
        { status: 400 }
      );
    }

    // Use the most recent payment method
    const paymentMethod = paymentMethods.data[0];

    // Calculate total amount
    const totalAmount = finalAmount + (additionalCharges || 0);

    // Create new payment intent for final charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Convert to cents
      currency: 'usd',
      customer: rental.stripeCustomerId,
      payment_method: paymentMethod.id,
      off_session: true,
      confirm: true,
      metadata: {
        rental_id: rental.id,
        charge_type: 'final_rental_charge',
        original_final_amount: rental.pricing.finalAmount.toString(),
        actual_final_amount: totalAmount.toString(),
        additional_charges: (additionalCharges || 0).toString()
      }
    });

    // Update rental with final payment info
    await rentalDB.updateRental(rental.id, {
      payment: {
        ...rental.payment,
        finalPaymentIntentId: paymentIntent.id,
        finalPaymentStatus: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending'
      },
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'active'
    });

    return NextResponse.json({
      success: true,
      data: {
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          paymentMethod: {
            id: paymentMethod.id,
            last4: paymentMethod.card?.last4,
            brand: paymentMethod.card?.brand
          }
        }
      }
    });

  } catch (error) {
    console.error('Error charging final amount:', error);
    
    // Handle authentication required error
    if (error instanceof Error && error.message.includes('authentication_required')) {
      // Save the payment intent that needs authentication
      const paymentIntent = (error as any).payment_intent;
      
      await rentalDB.updateRental(id, {
        payment: {
          ...rental.payment,
          finalPaymentIntentId: paymentIntent.id,
          finalPaymentStatus: 'pending'
        }
      });

      return NextResponse.json({
        success: false,
        requiresAuth: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          message: 'Customer authentication required'
        }
      });
    }

    return NextResponse.json(
      { error: 'Failed to charge final amount: ' + error.message },
      { status: 500 }
    );
  }
}