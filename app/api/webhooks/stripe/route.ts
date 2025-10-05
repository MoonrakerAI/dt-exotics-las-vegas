// Runtime configuration MUST be before any imports in Next.js App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import kvRentalDB from '@/app/lib/kv-database';
import carDB from '@/app/lib/car-database';
import notificationService from '@/app/lib/notifications';
import systemAlerts from '@/app/lib/system-alerts';
import type { RentalBooking } from '@/app/types/rental';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { kv } from '@vercel/kv';
import promoDB from '@/app/lib/promo-database';

// Lazy initialize Stripe to avoid build-time errors
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });
  }
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  return stripe;
}

async function constructEventWithAnySecret(body: string, signature: string) {
  const live = process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET
  const test = process.env.STRIPE_WEBHOOK_SECRET_TEST
  const secrets = [live, test].filter(Boolean) as string[]
  let lastError: any = null
  for (const sec of secrets) {
    try {
      return getStripe().webhooks.constructEvent(body, signature, sec)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError || new Error('No valid webhook secret configured')
}

async function bumpMetricsCacheVersion(livemode: boolean) {
  const mode = livemode ? 'live' : 'test'
  const key = `stripe:metrics:version:${mode}`
  try {
    await kv.incr(key)
  } catch (e) {
    // If key doesn't exist, set to 1
    await kv.set(key, 1)
  }
}

export async function POST(request: NextRequest) {
  // Guard: ensure Stripe and webhook secrets are configured at runtime
  const hasSecretKey = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_dummy';
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET_LIVE || !!process.env.STRIPE_WEBHOOK_SECRET || !!process.env.STRIPE_WEBHOOK_SECRET_TEST;
  if (!hasSecretKey || !hasWebhookSecret) {
    console.error('[WEBHOOK] Stripe not configured properly (missing secret key or webhook secret)');
    return NextResponse.json(
      { error: 'Payment system not configured. Please contact support.' },
      { status: 500 }
    );
  }
  try {
    // Load notification settings from KV store
    const savedSettings = await kv.get('notification_settings');
    if (savedSettings) {
      notificationService.updateSettings(savedSettings as any);
      console.log('[WEBHOOK] Notification settings loaded:', savedSettings);
    } else {
      console.log('[WEBHOOK] No saved notification settings found, using defaults');
    }

    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = await constructEventWithAnySecret(body, signature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      await systemAlerts.alertWebhookFailure(error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.amount_capturable_updated':
        await handlePaymentIntentAuthorized(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        await bumpMetricsCacheVersion(event.livemode)
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        await bumpMetricsCacheVersion(event.livemode)
        break;
      
      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        await bumpMetricsCacheVersion(event.livemode)
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentAuthorized(paymentIntent: any) {
  console.log('Payment authorized (amount capturable updated):', paymentIntent.id)
  
  // Try to get rental from database first
  let rental = await kvRentalDB.getRentalByPaymentIntent(paymentIntent.id)
  
  // If no rental exists, create one from payment intent metadata
  if (!rental) {
    console.log('No existing rental found, creating from payment intent metadata')
    
    const metadata = paymentIntent.metadata
    if (!metadata || !metadata.car_id || !metadata.start_date || !metadata.end_date || !metadata.customer_email) {
      console.error('Payment intent missing required metadata for rental creation:', paymentIntent.id)
      return
    }

    // Get car details
    const car = await carDB.getCar(metadata.car_id)
    if (!car) {
      console.error('Car not found for rental creation:', metadata.car_id)
      return
    }

    // Get customer details from Stripe
    const customer = await getStripe().customers.retrieve(paymentIntent.customer)
    if (!customer || customer.deleted) {
      console.error('Customer not found:', paymentIntent.customer)
      return
    }



    // Create complete rental record
    const rentalData: RentalBooking = {
      id: crypto.randomUUID(),
      carId: metadata.car_id,
      customerId: paymentIntent.customer as string,
      stripeCustomerId: paymentIntent.customer as string,
      customer: {
        firstName: metadata.customer_first_name || (customer as any).name?.split(' ')[0] || 'Customer',
        lastName: metadata.customer_last_name || (customer as any).name?.split(' ').slice(1).join(' ') || '',
        email: metadata.customer_email,
        phone: (customer as any).phone || 'Not provided',
        driversLicense: 'Not provided',
        driversLicenseState: 'Not provided'
      },
      car: {
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        dailyPrice: car.price.daily
      },
      rentalDates: {
        startDate: metadata.start_date,
        endDate: metadata.end_date
      },
      pricing: {
        dailyRate: car.price.daily,
        totalDays: parseInt(metadata.rental_days || '1'),
        subtotal: car.price.daily * parseInt(metadata.rental_days || '1'),
        depositAmount: paymentIntent.amount / 100, // Convert from cents
        finalAmount: car.price.daily * parseInt(metadata.rental_days || '1')
      },
      ...(metadata.promo_code ? {
        promo: {
          code: metadata.promo_code,
          partnerId: metadata.promo_partner_id || undefined,
          partnerName: metadata.promo_partner_name || undefined,
        }
      } : {}),
      payment: {
        depositPaymentIntentId: paymentIntent.id,
        depositStatus: 'authorized' as const,
        stripeCustomerId: paymentIntent.customer as string,
        savedPaymentMethodId: paymentIntent.payment_method as string
      },
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    rental = await kvRentalDB.createRental(rentalData)
    console.log('Created new rental:', rental.id)

    // Send booking confirmation emails (only for new rentals created from webhook)
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
        totalAmount: paymentIntent.amount / 100, // This would be calculated properly in real scenario
        status: rental.status
      }

      // Send admin notification
      console.log('Sending admin booking notification...')
      await notificationService.sendBookingNotification(bookingData)

      // Send customer confirmation
      console.log('Sending customer booking confirmation...')
      await notificationService.sendCustomerBookingConfirmation(bookingData)
      
      console.log('Booking confirmation emails sent successfully')
    } catch (emailError) {
      console.error('Failed to send booking confirmation emails:', emailError)
    }
  } else {
    // Update existing rental
    if (rental.payment.depositPaymentIntentId === paymentIntent.id) {
      await kvRentalDB.updateRental(rental.id, {
        payment: {
          ...rental.payment,
          depositStatus: 'authorized',
          savedPaymentMethodId: (paymentIntent as any).payment_method || rental.payment.savedPaymentMethodId,
          stripeCustomerId: (paymentIntent as any).customer || rental.payment.stripeCustomerId
        },
        status: rental.status === 'pending' ? 'confirmed' : rental.status
      })
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  const rental = await kvRentalDB.getRentalByPaymentIntent(paymentIntent.id);
  if (!rental) {
    console.error('Rental not found for payment intent:', paymentIntent.id);
    return;
  }

  // Get car details for notifications
  const car = await carDB.getCar(rental.carId);
  if (!car) {
    console.error('Car not found for rental:', rental.id);
    return;
  }

  // Update rental status based on payment type
  if (rental.payment.depositPaymentIntentId === paymentIntent.id) {
    // Deposit payment succeeded
    await kvRentalDB.updateRental(rental.id, {
      payment: {
        ...rental.payment,
        depositStatus: 'authorized',
        // Store saved payment method for future off-session charges
        savedPaymentMethodId: (paymentIntent as any).payment_method || rental.payment.savedPaymentMethodId,
        stripeCustomerId: (paymentIntent as any).customer || rental.payment.stripeCustomerId
      },
      status: 'confirmed'
    });

    // Send payment success notifications
    try {
      console.log('=== PAYMENT SUCCESS NOTIFICATIONS START ===');
      const paymentData = {
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
        customerEmail: rental.customer.email,
        vehicleName: `${car.brand} ${car.model}`,
        paymentType: 'Deposit',
        transactionId: paymentIntent.id,
        bookingId: rental.id
      };
      console.log('Payment data prepared:', JSON.stringify(paymentData, null, 2));

      // Send admin notification
      console.log('Sending admin payment success notification...');
      const adminResult = await notificationService.sendPaymentNotification(paymentData, true);
      console.log('Admin payment notification result:', adminResult);

      // Send customer payment receipt
      console.log('Sending customer payment receipt...');
      const customerResult = await notificationService.sendCustomerPaymentReceipt(paymentData);
      console.log('Customer payment receipt result:', customerResult);
      
      console.log('Payment success notifications completed');
      console.log('=== PAYMENT SUCCESS NOTIFICATIONS END ===');
    } catch (emailError) {
      console.error('=== PAYMENT SUCCESS NOTIFICATIONS ERROR ===');
      console.error('Failed to send payment success notifications:', emailError);
      console.error('Error stack:', emailError instanceof Error ? emailError.stack : 'No stack trace');
    }

    // Note: Booking confirmation emails are now sent during booking creation
    // This webhook only handles payment status updates
    console.log('Skipping booking confirmation emails - already sent during booking creation');

    // Increment promo stats if promo code was used
    const code = (paymentIntent.metadata && paymentIntent.metadata.promo_code) ? String(paymentIntent.metadata.promo_code).toUpperCase() : ''
    if (code) {
      try {
        await promoDB.incrementStats(code)
      } catch (e) {
        console.warn('[WEBHOOK] Failed to increment promo stats', { code, error: e instanceof Error ? e.message : String(e) })
      }
      // Persist promo metadata on rental if not already present
      if (!rental.promo) {
        await kvRentalDB.updateRental(rental.id, {
          promo: {
            code,
            partnerId: paymentIntent.metadata?.promo_partner_id || undefined,
            partnerName: paymentIntent.metadata?.promo_partner_name || undefined,
          }
        } as any)
      }
    }
  } else if (rental.payment.finalPaymentIntentId === paymentIntent.id) {
    // Final payment succeeded
    await kvRentalDB.updateRental(rental.id, {
      payment: {
        ...rental.payment,
        finalPaymentStatus: 'succeeded'
      },
      status: 'completed'
    });

    // Send final payment success notifications
    try {
      const paymentData = {
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
        customerEmail: rental.customer.email,
        vehicleName: `${car.brand} ${car.model}`,
        paymentType: 'Final Payment',
        transactionId: paymentIntent.id,
        bookingId: rental.id
      };

      // Send admin notification
      console.log('Sending admin final payment success notification...');
      await notificationService.sendPaymentNotification(paymentData, true);

      // Send customer payment receipt
      console.log('Sending customer final payment receipt...');
      await notificationService.sendCustomerPaymentReceipt(paymentData);
      
      console.log('Final payment success notifications sent successfully');
    } catch (emailError) {
      console.error('Failed to send final payment success notifications:', emailError);
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log('Payment failed:', paymentIntent.id);
  
  const rental = await kvRentalDB.getRentalByPaymentIntent(paymentIntent.id);
  if (!rental) {
    console.error('Rental not found for payment intent:', paymentIntent.id);
    return;
  }

  // Get car details for notifications
  const car = await carDB.getCar(rental.carId);
  if (!car) {
    console.error('Car not found for rental:', rental.id);
    return;
  }

  // Update rental status based on payment type
  if (rental.payment.depositPaymentIntentId === paymentIntent.id) {
    // Deposit payment failed
    await kvRentalDB.updateRental(rental.id, {
      payment: {
        ...rental.payment,
        depositStatus: 'failed'
      },
      status: 'cancelled'
    });

    // Send payment failure notifications
    try {
      const paymentData = {
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
        customerEmail: rental.customer.email,
        vehicleName: `${car.brand} ${car.model}`,
        paymentType: 'Deposit',
        transactionId: paymentIntent.id,
        bookingId: rental.id,
        reason: paymentIntent.last_payment_error?.message || 'Payment declined',
        remainingBalance: paymentIntent.amount / 100
      };

      // Send admin notification
      console.log('Sending admin payment failed notification...');
      await notificationService.sendPaymentNotification(paymentData, false);

      // Send customer payment failed notification
      console.log('Sending customer payment failed notification...');
      await notificationService.sendCustomerPaymentFailed(paymentData);
      
      console.log('Payment failure notifications sent successfully');
    } catch (emailError) {
      console.error('Failed to send payment failure notifications:', emailError);
    }
  } else if (rental.payment.finalPaymentIntentId === paymentIntent.id) {
    // Final payment failed
    await kvRentalDB.updateRental(rental.id, {
      payment: {
        ...rental.payment,
        finalPaymentStatus: 'failed'
      }
    });

    // Send final payment failure notifications
    try {
      const paymentData = {
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase(),
        customerName: `${rental.customer.firstName} ${rental.customer.lastName}`,
        customerEmail: rental.customer.email,
        vehicleName: `${car.brand} ${car.model}`,
        paymentType: 'Final Payment',
        transactionId: paymentIntent.id,
        bookingId: rental.id,
        reason: paymentIntent.last_payment_error?.message || 'Payment declined',
        remainingBalance: paymentIntent.amount / 100
      };

      // Send admin notification
      console.log('Sending admin final payment failed notification...');
      await notificationService.sendPaymentNotification(paymentData, false);

      // Send customer payment failed notification
      console.log('Sending customer final payment failed notification...');
      await notificationService.sendCustomerPaymentFailed(paymentData);
      
      console.log('Final payment failure notifications sent successfully');
    } catch (emailError) {
      console.error('Failed to send final payment failure notifications:', emailError);
    }
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent: any) {
  console.log('Payment requires action:', paymentIntent.id);
  
  const rental = await kvRentalDB.getRentalByPaymentIntent(paymentIntent.id);
  if (!rental) {
    console.error('Rental not found for payment intent:', paymentIntent.id);
    return;
  }

  // Could send email notification to customer here
  console.log('Customer needs to complete authentication for rental:', rental.id);
}

async function handlePaymentIntentCanceled(paymentIntent: any) {
  console.log('Payment canceled:', paymentIntent.id);
  
  const rental = await kvRentalDB.getRentalByPaymentIntent(paymentIntent.id);
  if (!rental) {
    console.error('Rental not found for payment intent:', paymentIntent.id);
    return;
  }

  await kvRentalDB.updateRental(rental.id, {
    status: 'cancelled'
  });
}