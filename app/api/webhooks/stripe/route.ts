// Runtime configuration MUST be before any imports in Next.js App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';
import kvRentalDB from '@/app/lib/kv-database';
import { headers } from 'next/headers';
import { kv } from '@vercel/kv';

async function constructEventWithAnySecret(body: string, signature: string) {
  const live = process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET
  const test = process.env.STRIPE_WEBHOOK_SECRET_TEST
  const secrets = [live, test].filter(Boolean) as string[]
  let lastError: any = null
  for (const sec of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, sec)
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
  const rental = await kvRentalDB.getRentalByPaymentIntent(paymentIntent.id)
  if (!rental) {
    console.error('Rental not found for payment intent:', paymentIntent.id)
    return
  }

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

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  const rental = await kvRentalDB.getRentalByPaymentIntent(paymentIntent.id);
  if (!rental) {
    console.error('Rental not found for payment intent:', paymentIntent.id);
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
  } else if (rental.payment.finalPaymentIntentId === paymentIntent.id) {
    // Final payment succeeded
    await kvRentalDB.updateRental(rental.id, {
      payment: {
        ...rental.payment,
        finalPaymentStatus: 'succeeded'
      },
      status: 'completed'
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log('Payment failed:', paymentIntent.id);
  
  const rental = await kvRentalDB.getRentalByPaymentIntent(paymentIntent.id);
  if (!rental) {
    console.error('Rental not found for payment intent:', paymentIntent.id);
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
  } else if (rental.payment.finalPaymentIntentId === paymentIntent.id) {
    // Final payment failed
    await kvRentalDB.updateRental(rental.id, {
      payment: {
        ...rental.payment,
        finalPaymentStatus: 'failed'
      }
    });
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