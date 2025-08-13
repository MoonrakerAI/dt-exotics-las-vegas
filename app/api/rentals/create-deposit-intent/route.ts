import { NextResponse } from 'next/server';

// Minimal test version of the deposit endpoint
export async function POST() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'Deposit endpoint is working',
      data: {
        test: true
      }
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Test error occurred' },
      { status: 500 }
    );
  }
}

// Add a GET handler for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Deposit endpoint is working (GET)',
    data: {
      test: true
    }
  });
}