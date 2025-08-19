import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';
import carDB from '@/app/lib/car-database';
import kvRentalDB from '@/app/lib/kv-database';
import { calculateRentalPricing } from '@/app/lib/rental-utils';
import notificationService from '@/app/lib/notifications';
import type { RentalBooking } from '@/app/types/rental';

// Enhanced test version with request handling
export async function POST(request: NextRequest) {
  try {
    console.log('[DEPOSIT-INTENT] Request received');
    
    // Log request headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('[DEPOSIT-INTENT] Headers:', JSON.stringify(headers, null, 2));
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('[DEPOSIT-INTENT] Request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[DEPOSIT-INTENT] Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.carId || !body.startDate || !body.endDate || !body.customer) {
      const missingFields = [];
      if (!body.carId) missingFields.push('carId');
      if (!body.startDate) missingFields.push('startDate');
      if (!body.endDate) missingFields.push('endDate');
      if (!body.customer) missingFields.push('customer');
      
      console.error(`[DEPOSIT-INTENT] Missing required fields: ${missingFields.join(', ')}`);
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields 
        },
        { status: 400 }
      );
    }
    
    // Check Stripe configuration
    console.log('[DEPOSIT-INTENT] Checking Stripe configuration...');
    const stripeConfigured = !!process.env.STRIPE_SECRET_KEY && 
                           process.env.STRIPE_SECRET_KEY !== 'sk_test_dummy' && 
                           !!stripe;
    
    if (!stripeConfigured) {
      console.error('[DEPOSIT-INTENT] Stripe not properly configured');
      return NextResponse.json(
        { 
          error: 'Payment system not configured',
          details: 'Stripe is not properly configured on the server'
        },
        { status: 500 }
      );
    }

    console.log('[DEPOSIT-INTENT] Stripe API key prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    
    // Find the car from database (to get current pricing)
    console.log(`[DEPOSIT-INTENT] Looking for car ID: ${body.carId}`);
    
    const car = await carDB.getCar(body.carId);
    if (!car) {
      console.error(`[DEPOSIT-INTENT] Car not found: ${body.carId}`);
      const allCars = await carDB.getAllCars();
      console.error(`[DEPOSIT-INTENT] Available cars:`, allCars.map(c => ({ id: c.id, brand: c.brand, model: c.model, year: c.year })));
      return NextResponse.json(
        { 
          error: 'Selected car not found',
          requestedId: body.carId,
          availableIds: allCars.map(c => c.id),
          availableCars: allCars.map(c => ({ id: c.id, brand: c.brand, model: c.model, year: c.year }))
        },
        { status: 404 }
      );
    }

    // Calculate pricing
    const pricing = calculateRentalPricing(
      car,
      body.startDate,
      body.endDate
    );

    console.log(`[DEPOSIT-INTENT] Creating payment intent for ${car.brand} ${car.model}`);
    console.log(`[DEPOSIT-INTENT] Amount: $${pricing.depositAmount} (${pricing.depositAmount * 100} cents)`);
    
    try {
      // Create or retrieve Stripe customer
      let customer;
      const existingCustomers = await stripe.customers.list({
        email: body.customer.email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
        console.log(`[DEPOSIT-INTENT] Using existing customer: ${customer.id}`);
      } else {
        customer = await stripe.customers.create({
          email: body.customer.email,
          name: `${body.customer.firstName} ${body.customer.lastName}`.trim(),
          phone: body.customer.phone,
          metadata: {
            firstName: body.customer.firstName,
            lastName: body.customer.lastName
          }
        });
        console.log(`[DEPOSIT-INTENT] Created new customer: ${customer.id}`);
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(pricing.depositAmount * 100), // Convert to cents
        currency: 'usd',
        customer: customer.id,
        metadata: {
          type: 'rental_deposit',
          car_id: car.id,
          car_model: `${car.year} ${car.brand} ${car.model}`,
          start_date: body.startDate,
          end_date: body.endDate,
          customer_email: body.customer.email,
          customer_first_name: body.customer.firstName,
          customer_last_name: body.customer.lastName,
          customer_phone: body.customer.phone,
          daily_rate: car.price.daily.toString(),
          total_days: pricing.totalDays.toString()
        },
        description: `Deposit for ${car.brand} ${car.model} rental (${body.startDate} to ${body.endDate})`,
        // For testing, you can add test cards: https://stripe.com/docs/testing#cards
        payment_method_options: {
          card: {
            request_three_d_secure: 'any'
          }
        },
        capture_method: 'manual', // Important: We'll capture later
        confirm: false,
        setup_future_usage: 'off_session' // Save payment method for future use
      });

      console.log(`[DEPOSIT-INTENT] Created payment intent: ${paymentIntent.id}`);
      
      // Create rental booking in database
      const rentalId = `rental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const rental: RentalBooking = {
        id: rentalId,
        customerId: customer.id,
        stripeCustomerId: customer.id,
        carId: car.id,
        car: {
          id: car.id,
          brand: car.brand,
          model: car.model,
          year: car.year,
          dailyPrice: car.price.daily
        },
        status: 'pending',
        rentalDates: {
          startDate: body.startDate,
          endDate: body.endDate
        },
        customer: {
          firstName: body.customer.firstName,
          lastName: body.customer.lastName,
          email: body.customer.email,
          phone: body.customer.phone,
          driversLicense: body.customer.driversLicense || '',
          driversLicenseState: body.customer.driversLicenseState || 'NV'
        },
        payment: {
          depositPaymentIntentId: paymentIntent.id,
          depositStatus: 'pending',
          finalPaymentStatus: 'pending',
          stripeCustomerId: customer.id
        },
        pricing: {
          dailyRate: pricing.dailyRate,
          totalDays: pricing.totalDays,
          subtotal: pricing.subtotal,
          depositAmount: pricing.depositAmount,
          finalAmount: pricing.subtotal - pricing.depositAmount
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save rental to database
      await kvRentalDB.createRental(rental);
      console.log(`[DEPOSIT-INTENT] Created rental booking: ${rentalId}`);
      
      // Send initial booking notification emails
      try {
        const bookingData = {
          id: rental.id,
          car: {
            brand: car.brand,
            model: car.model,
            year: car.year
          },
          customer: rental.customer,
          startDate: rental.rentalDates.startDate,
          endDate: rental.rentalDates.endDate,
          depositAmount: rental.pricing.depositAmount,
          totalAmount: rental.pricing.subtotal,
          status: rental.status
        };

        console.log('[DEPOSIT-INTENT] Sending booking notification emails...');
        
        // Send admin notification
        await notificationService.sendBookingNotification(bookingData);
        console.log('[DEPOSIT-INTENT] Admin booking notification sent');

        // Send customer confirmation
        await notificationService.sendCustomerBookingConfirmation(bookingData);
        console.log('[DEPOSIT-INTENT] Customer booking confirmation sent');
        
      } catch (emailError) {
        console.error('[DEPOSIT-INTENT] Failed to send booking notification emails:', emailError);
        // Don't fail the booking creation if email fails
      }
      
      // Return client secret to confirm payment on client side
      return NextResponse.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: {
            id: customer.id,
            email: customer.email
          },
          rental: {
            carId: car.id,
            carModel: `${car.year} ${car.brand} ${car.model}`,
            startDate: body.startDate,
            endDate: body.endDate,
            depositAmount: pricing.depositAmount,
            dailyRate: pricing.dailyRate,
            totalDays: pricing.totalDays
          }
        }
      });
      
    } catch (error: any) {
      console.error('[DEPOSIT-INTENT] Error creating payment intent:', error);
      
      let errorMessage = 'Failed to create payment';
      if (error.type === 'StripeCardError') {
        errorMessage = error.message || 'Card was declined';
      } else if (error.type) {
        // Handle other Stripe errors
        errorMessage = `Payment error (${error.type}): ${error.message || 'Please try again'}`;
      }
      
      return NextResponse.json(
        { 
          error: 'Payment processing failed',
          details: errorMessage,
          code: error.code,
          type: error.type
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('[DEPOSIT-INTENT] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Keep GET handler for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Deposit endpoint is working (GET)',
    data: {
      test: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }
  });
}