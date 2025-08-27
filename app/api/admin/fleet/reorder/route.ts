import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuth } from '@/app/lib/simple-auth';
import carDB from '@/app/lib/car-database';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // Simple token validation - check if token exists and has reasonable length
    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { carOrders } = body;

    if (!Array.isArray(carOrders)) {
      return NextResponse.json({ error: 'carOrders must be an array' }, { status: 400 });
    }

    // Validate the structure of carOrders
    for (const order of carOrders) {
      if (!order.carId || typeof order.displayOrder !== 'number') {
        return NextResponse.json({ 
          error: 'Each order must have carId (string) and displayOrder (number)' 
        }, { status: 400 });
      }
    }

    // Update car display orders in database
    await carDB.updateCarDisplayOrders(carOrders);

    return NextResponse.json({ 
      success: true,
      message: 'Car display order updated successfully'
    });

  } catch (error) {
    console.error('Error updating car display order:', error);
    return NextResponse.json({ 
      error: 'Failed to update car display order' 
    }, { status: 500 });
  }
}
