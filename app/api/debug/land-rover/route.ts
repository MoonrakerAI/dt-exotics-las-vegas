import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import carDB from '@/app/lib/car-database';

// Temporary debug endpoint to check Land Rover Discovery data
export async function GET(request: NextRequest) {
  try {
    const carId = 'land-rover-d-2019';
    
    const results = {
      timestamp: new Date().toISOString(),
      carId,
      tests: {} as any
    };
    
    // Test 1: Direct KV lookup
    try {
      const directCar = await kv.get(`car:${carId}`);
      results.tests.directKV = {
        success: !!directCar,
        price: directCar ? (directCar as any).price : null,
        available: directCar ? (directCar as any).available : null
      };
    } catch (error) {
      results.tests.directKV = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 2: Car database getCar
    try {
      const dbCar = await carDB.getCar(carId);
      results.tests.carDBGetCar = {
        success: !!dbCar,
        price: dbCar ? dbCar.price : null,
        available: dbCar ? dbCar.available : null
      };
    } catch (error) {
      results.tests.carDBGetCar = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 3: Car database getAllCars
    try {
      const allCars = await carDB.getAllCars();
      const foundCar = allCars.find(car => car.id === carId);
      results.tests.carDBGetAllCars = {
        success: !!foundCar,
        totalCars: allCars.length,
        price: foundCar ? foundCar.price : null,
        available: foundCar ? foundCar.available : null
      };
    } catch (error) {
      results.tests.carDBGetAllCars = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Test 4: Check cars:all set
    try {
      const carIds = await kv.smembers('cars:all');
      results.tests.carsAllSet = {
        success: true,
        totalIds: carIds.length,
        hasLandRover: carIds.includes(carId),
        allIds: carIds
      };
    } catch (error) {
      results.tests.carsAllSet = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
