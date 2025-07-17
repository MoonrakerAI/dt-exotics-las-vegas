import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    adminToken: process.env.ADMIN_TOKEN ? 'SET' : 'NOT SET'
  });
}