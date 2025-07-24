import { NextRequest, NextResponse } from 'next/server';
import carDB from '@/app/lib/car-database';
import { cars } from '@/app/data/cars';

// POST: Reset Corvette data with YouTube video (debug only)
export async function POST(request: NextRequest) {
  try {
    // Find the Corvette in static data
    const corvette = cars.find(car => car.id === 'corvette-c8');
    
    if (!corvette) {
      return NextResponse.json({ error: 'Corvette not found in static data' }, { status: 404 });
    }
    
    console.log('Resetting Corvette data with:', corvette);
    
    // Update the Corvette in the database
    await carDB.updateCar(corvette.id, corvette);
    
    return NextResponse.json({ 
      success: true,
      message: 'Corvette data reset with YouTube video',
      car: corvette
    });
    
  } catch (error) {
    console.error('Reset Corvette error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 