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

  const { finalAmount, additionalCharges } = await request.json();
  const { id } = await params;

  let rental: any;

  try {
    rental = await kvRentalDB.getRental(id);
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
      description: `Final Rental Payment - ${rental.car.brand} ${rental.car.model} (${rental.car.year}) | ${new Date(rental.rentalDates.startDate).toLocaleDateString()} - ${new Date(rental.rentalDates.endDate).toLocaleDateString()} | Balance: $${finalAmount}${additionalCharges ? ` + Additional: $${additionalCharges}` : ''}`,
      statement_descriptor_suffix: 'RENTAL',
      metadata: {
        rental_id: rental.id,
        charge_type: 'final_rental_charge',
        original_final_amount: rental.pricing.finalAmount.toString(),
        actual_final_amount: totalAmount.toString(),
        additional_charges: (additionalCharges || 0).toString()
      }
    });

    // Update rental with final payment info
    await kvRentalDB.updateRental(rental.id, {
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
      
      await kvRentalDB.updateRental(id, {
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
      { error: 'Failed to charge final amount: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}