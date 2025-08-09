import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';
import kvRentalDB from '@/app/lib/kv-database';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
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
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
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
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
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