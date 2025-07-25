import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';
import { cars } from '@/app/data/cars';
import { calculateRentalPricing, generateRentalId } from '@/app/lib/rental-utils';
import kvRentalDB from '@/app/lib/kv-database';
import { validateRentalRequest } from '@/app/lib/validation';
import { rentalCreationRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';
import { CreateRentalRequest, RentalBooking } from '@/app/types/rental';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await rentalCreationRateLimiter.checkLimit(clientId);
    
    if (!rateLimitResult.success) {
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
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_dummy') {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    
    // Validate and sanitize input data
    const validation = validateRentalRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const sanitizedData = validation.sanitizedValue as CreateRentalRequest;
    const { carId, startDate, endDate, customer } = sanitizedData;

    // Find the car
    const car = cars.find(c => c.id === carId);
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // Check availability
    const isAvailable = await kvRentalDB.isCarAvailable(carId, startDate, endDate);
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Car is not available for selected dates' },
        { status: 409 }
      );
    }

    // Calculate pricing
    const pricing = calculateRentalPricing(car, startDate, endDate);

    // Create or retrieve Stripe customer
    let stripeCustomer;
    try {
      const customers = await stripe.customers.list({
        email: customer.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        stripeCustomer = customers.data[0];
      } else {
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

    // Create Payment Intent with manual capture for deposit
    const paymentIntent = await stripe.paymentIntents.create({
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

    await kvRentalDB.createRental(rental);

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