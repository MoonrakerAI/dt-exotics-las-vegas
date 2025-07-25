import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { Invoice } from '@/app/types/invoice';
import Stripe from 'stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment configuration missing' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });

    const { id } = await params;
    const body = await request.json();
    const { amount, invoiceId } = body;

    // Get the invoice
    const invoice = await kv.get(`invoice:${id}`) as Invoice;
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    // Check if invoice is available for payment (not draft)
    if (invoice.status === 'draft') {
      return NextResponse.json(
        { error: 'Invoice is not available for payment' },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    let stripeCustomer;
    if (invoice.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(invoice.stripeCustomerId);
    } else {
      stripeCustomer = await stripe.customers.create({
        name: invoice.customer.name,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber
        }
      });

      // Update invoice with customer ID
      await kv.set(`invoice:${id}`, {
        ...invoice,
        stripeCustomerId: stripeCustomer.id,
        updatedAt: new Date().toISOString()
      });
    }

    // Create Stripe Checkout Session for direct payment
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: invoice.title,
              description: invoice.description || `Invoice ${invoice.invoiceNumber}`,
              metadata: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                serviceType: invoice.serviceType
              }
            },
            unit_amount: Math.round(invoice.totalAmount * 100), // Convert to cents
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invoice/${invoice.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invoice/${invoice.id}?payment_cancelled=true`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        paymentType: 'full_payment'
      },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Payment for ${invoice.title} - Invoice ${invoice.invoiceNumber}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber
          },
          custom_fields: [
            {
              name: 'Invoice Number',
              value: invoice.invoiceNumber
            },
            {
              name: 'Service Type',
              value: invoice.serviceType.replace('_', ' ').toUpperCase()
            }
          ]
        }
      },
      automatic_tax: {
        enabled: false
      }
    });

    // Store payment session for tracking
    await kv.set(`payment_session:${session.id}`, {
      invoiceId: invoice.id,
      sessionId: session.id,
      amount: invoice.totalAmount,
      createdAt: new Date().toISOString()
    }, { ex: 86400 * 7 }); // Expire in 7 days

    return NextResponse.json({
      success: true,
      paymentUrl: session.url,
      sessionId: session.id,
      amount: invoice.totalAmount
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}