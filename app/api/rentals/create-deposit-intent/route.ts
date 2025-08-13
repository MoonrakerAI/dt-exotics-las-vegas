import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';

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
    
    console.log('[DEPOSIT-INTENT] Stripe configured:', stripeConfigured);
    if (stripeConfigured) {
      console.log('[DEPOSIT-INTENT] Stripe API key prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    }
    
    // Return success response with request data
    return NextResponse.json({
      status: 'ok',
      message: 'Deposit endpoint is working',
      data: {
        requestReceived: true,
        stripeConfigured,
        requestData: {
          carId: body.carId,
          startDate: body.startDate,
          endDate: body.endDate,
          customerEmail: body.customer?.email
        }
      }
    });
    
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