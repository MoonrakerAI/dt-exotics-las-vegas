// Runtime configuration MUST be before any imports in Next.js App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';
import { cars } from '@/app/data/cars';
import { calculateRentalPricing, generateRentalId } from '@/app/lib/rental-utils';
import kvRentalDB from '@/app/lib/kv-database';
import { validateRentalRequest } from '@/app/lib/validation';
import { rentalCreationRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';
import { CreateRentalRequest, RentalBooking } from '@/app/types/rental';

export async function POST(request: NextRequest) {
  console.log('[CREATE-DEPOSIT] Request received');
  
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await rentalCreationRateLimiter.checkLimit(clientId);
    
    if (!rateLimitResult.success) {
      console.log('[CREATE-DEPOSIT] Rate limit exceeded for client:', clientId);
      return NextResponse.json(
        { 
          error: 'Too many rental requests. Please try again later.',
          resetTime: rateLimitResult.resetTime
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
          }
        }
      )
    }

    // Check if Stripe is configured
    console.log('[CREATE-DEPOSIT] Checking Stripe config...');
    console.log('[CREATE-DEPOSIT] STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('[CREATE-DEPOSIT] STRIPE_SECRET_KEY prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    console.log('[CREATE-DEPOSIT] Stripe client initialized:', !!stripe);
    
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy' || !stripe) {
      console.error('[CREATE-DEPOSIT] Stripe not configured properly');
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    console.log('[CREATE-DEPOSIT] Request body:', JSON.stringify(body, null, 2));
    
    // Validate and sanitize input data
    console.log('[CREATE-DEPOSIT] Validating request...');
    const validation = validateRentalRequest(body);
    if (!validation.valid) {
      console.error('[CREATE-DEPOSIT] Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    console.log('[CREATE-DEPOSIT] Validation passed');

    const sanitizedData = validation.sanitizedValue as CreateRentalRequest;
    const { carId, startDate, endDate, customer } = sanitizedData;

    // Find the car
    console.log('[CREATE-DEPOSIT] Looking for car:', carId);
    const car = cars.find(c => c.id === carId);
    if (!car) {
      console.error('[CREATE-DEPOSIT] Car not found:', carId);
      console.log('[CREATE-DEPOSIT] Available car IDs:', cars.map(c => c.id));
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }
    console.log('[CREATE-DEPOSIT] Car found:', car.brand, car.model);

    // Check availability
    console.log('[CREATE-DEPOSIT] Checking availability for:', carId, startDate, endDate);
    const isAvailable = await kvRentalDB.isCarAvailable(carId, startDate, endDate);
    console.log('[CREATE-DEPOSIT] Availability result:', isAvailable);
    if (!isAvailable) {
      console.error('[CREATE-DEPOSIT] Car not available for dates');
      return NextResponse.json(
        { error: 'Car is not available for selected dates' },
        { status: 409 }
      );
    }

    // Calculate pricing
    console.log('[CREATE-DEPOSIT] Calculating pricing...');
    const pricing = calculateRentalPricing(car, startDate, endDate);
    console.log('[CREATE-DEPOSIT] Pricing calculated:', pricing);

    // Create or retrieve Stripe customer
    console.log('[CREATE-DEPOSIT] Creating/retrieving Stripe customer for:', customer.email);
    let stripeCustomer;
    try {
      const customers = await stripe.customers.list({
        email: customer.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        stripeCustomer = customers.data[0];
        console.log('[CREATE-DEPOSIT] Found existing Stripe customer:', stripeCustomer.id);
      } else {
        console.log('[CREATE-DEPOSIT] Creating new Stripe customer');
        stripeCustomer = await stripe.customers.create({
          email: customer.email,
          name: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
          metadata: {
            drivers_license: customer.driversLicense
          }
        });
      }
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    // Generate rental ID
    const rentalId = generateRentalId();
    console.log('[CREATE-DEPOSIT] Generated rental ID:', rentalId);

    // Create Payment Intent with manual capture for deposit
    console.log('[CREATE-DEPOSIT] Creating payment intent for amount:', pricing.depositAmount);
    let paymentIntent;
    
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: pricing.depositAmount * 100, // Convert to cents
        currency: 'usd',
        capture_method: 'manual', // Hold funds without capturing
        customer: stripeCustomer.id,
        setup_future_usage: 'off_session', // Save payment method for later
        payment_method_types: ['card'],
        description: `Rental Deposit - ${car.brand} ${car.model} (${car.year}) | ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()} | ${pricing.totalDays} days @ $${pricing.dailyRate}/day`,
        statement_descriptor_suffix: 'RENTAL',
        metadata: {
          rental_id: rentalId,
          car_id: carId,
          car_model: `${car.brand} ${car.model}`,
          start_date: startDate,
          end_date: endDate,
          total_days: pricing.totalDays.toString(),
          daily_rate: pricing.dailyRate.toString(),
          subtotal: pricing.subtotal.toString(),
          deposit_amount: pricing.depositAmount.toString(),
          final_amount: pricing.finalAmount.toString()
        }
      });
      console.log('[CREATE-DEPOSIT] Payment intent created successfully:', paymentIntent.id);
    } catch (stripeError: any) {
      console.error('[CREATE-DEPOSIT] Stripe error creating payment intent:', stripeError);
      console.error('[CREATE-DEPOSIT] Error type:', stripeError.type);
      console.error('[CREATE-DEPOSIT] Error code:', stripeError.code);
      console.error('[CREATE-DEPOSIT] Error message:', stripeError.message);
      console.error('[CREATE-DEPOSIT] Raw error:', stripeError.raw);
      
      // Return specific error information
      return NextResponse.json(
        { 
          error: 'Failed to create payment intent',
          details: stripeError.message || 'Unknown Stripe error',
          type: stripeError.type,
          code: stripeError.code
        },
        { status: 500 }
      );
    }

    // Create rental record
    const rental: RentalBooking = {
      id: rentalId,
      customerId: customer.email, // Using email as customer ID for simplicity
      stripeCustomerId: stripeCustomer.id,
      carId,
      car: {
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        dailyPrice: car.price.daily
      },
      rentalDates: {
        startDate,
        endDate
      },
      pricing,
      customer,
      payment: {
        depositPaymentIntentId: paymentIntent.id,
        depositStatus: 'pending',
        stripeCustomerId: stripeCustomer.id
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('[CREATE-DEPOSIT] Saving rental to database...');
    await kvRentalDB.createRental(rental);
    console.log('[CREATE-DEPOSIT] Rental saved successfully');

    console.log('[CREATE-DEPOSIT] Returning success response');
    return NextResponse.json({
      success: true,
      data: {
        rentalId,
        paymentIntent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: pricing.depositAmount,
          currency: 'usd'
        },
        rental: {
          id: rentalId,
          car: rental.car,
          dates: rental.rentalDates,
          pricing: rental.pricing,
          customer: rental.customer
        }
      }
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
      }
    });

  } catch (error) {
    console.error('Error creating deposit intent:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid API key')) {
        return NextResponse.json(
          { error: 'Payment system configuration error. Please check environment variables.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('stripe')) {
        return NextResponse.json(
          { error: 'Payment processing error: ' + error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Server error: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}