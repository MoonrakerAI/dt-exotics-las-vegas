import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import { kv } from '@vercel/kv';
import { Invoice } from '@/app/types/invoice';
import Stripe from 'stripe';

// Secure admin authentication using JWT
async function isAdminAuthenticated(request: NextRequest): Promise<{user: any} | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const user = await verifyJWT(token);
    return user && user.role === 'admin' ? {user} : null;
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });

    const { id } = await params;
    const invoice = await kv.get(`invoice:${id}`) as Invoice;
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { sendEmail = false } = body;

    // Create or get Stripe customer
    let stripeCustomer;
    if (invoice.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(invoice.stripeCustomerId);
    } else {
      stripeCustomer = await stripe.customers.create({
        name: invoice.customer.name,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
        address: invoice.customer.address ? {
          line1: invoice.customer.address.line1,
          line2: invoice.customer.address.line2,
          city: invoice.customer.address.city,
          state: invoice.customer.address.state,
          postal_code: invoice.customer.address.zipCode,
          country: 'US'
        } : undefined,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber
        }
      });

      // Update invoice with customer ID
      invoice.stripeCustomerId = stripeCustomer.id;
    }

    // Determine payment amount (deposit or full amount)
    const paymentAmount = invoice.depositRequired && invoice.depositAmount 
      ? invoice.depositAmount 
      : invoice.totalAmount;

    // Create line items for Stripe
    const lineItems = [
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
          unit_amount: Math.round(paymentAmount * 100), // Convert to cents
        },
        quantity: 1,
      }
    ];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invoice/${invoice.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invoice/${invoice.id}?payment_cancelled=true`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        isDeposit: invoice.depositRequired && invoice.depositAmount ? 'true' : 'false'
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

    // Update invoice with payment link info
    const updatedInvoice = {
      ...invoice,
      stripeCustomerId: stripeCustomer.id,
      paymentLinkId: session.id,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`invoice:${id}`, updatedInvoice);

    // Store payment link for easy access
    await kv.set(`payment_link:${session.id}`, {
      invoiceId: invoice.id,
      sessionId: session.id,
      paymentAmount,
      createdAt: new Date().toISOString()
    }, { ex: 86400 * 7 }); // Expire in 7 days

    return NextResponse.json({
      success: true,
      message: 'Payment link created successfully',
      paymentUrl: session.url,
      sessionId: session.id,
      paymentAmount,
      isDeposit: invoice.depositRequired && invoice.depositAmount
    });

  } catch (error) {
    console.error('Payment link creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    );
  }
}