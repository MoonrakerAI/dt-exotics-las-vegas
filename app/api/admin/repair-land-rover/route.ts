import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { verifyJWT } from '@/app/lib/auth';
import { Car } from '@/app/data/cars';

// Direct repair endpoint for Land Rover Discovery price issue
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { newPrice } = await request.json();
    if (!newPrice || typeof newPrice !== 'number') {
      return NextResponse.json({ error: 'Invalid price provided' }, { status: 400 });
    }

    const carId = 'land-rover-d-2019';
    const carKey = `car:${carId}`;
    
    console.log(`[REPAIR] Starting direct repair for ${carId} with price $${newPrice}`);
    
    // Step 1: Get current car data
    const currentCar = await kv.get<Car>(carKey);
    if (!currentCar) {
      return NextResponse.json({ error: 'Car not found in KV storage' }, { status: 404 });
    }
    
    console.log(`[REPAIR] Current car data:`, currentCar);
    console.log(`[REPAIR] Current price: $${currentCar.price.daily}`);
    
    // Step 2: Update the price
    const updatedCar: Car = {
      ...currentCar,
      price: {
        daily: newPrice,
        weekly: newPrice * 6 // Standard calculation
      }
    };
    
    console.log(`[REPAIR] Updated car data:`, updatedCar);
    
    // Step 3: Force write to KV with multiple attempts
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!success && attempts < maxAttempts) {
      attempts++;
      console.log(`[REPAIR] Attempt ${attempts} to write to KV...`);
      
      try {
        // Delete the key first to ensure clean write
        await kv.del(carKey);
        console.log(`[REPAIR] Deleted existing key`);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Write new data
        const setResult = await kv.set(carKey, updatedCar);
        console.log(`[REPAIR] Set result:`, setResult);
        
        // Immediate verification
        const verification = await kv.get<Car>(carKey);
        if (verification && verification.price.daily === newPrice) {
          success = true;
          console.log(`[REPAIR] ✅ Success! Verified price: $${verification.price.daily}`);
        } else {
          console.log(`[REPAIR] ❌ Verification failed. Expected $${newPrice}, got $${verification?.price.daily}`);
        }
      } catch (error) {
        console.error(`[REPAIR] Attempt ${attempts} failed:`, error);
      }
    }
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to update KV storage after multiple attempts',
        attempts 
      }, { status: 500 });
    }
    
    // Step 4: Verify it's in the cars list
    const carIds = await kv.smembers('cars:all');
    if (!carIds.includes(carId)) {
      console.log(`[REPAIR] Adding ${carId} to cars:all set`);
      await kv.sadd('cars:all', carId);
    }
    
    // Step 5: Final verification
    const finalCheck = await kv.get<Car>(carKey);
    
    return NextResponse.json({
      success: true,
      message: `Land Rover Discovery price updated to $${newPrice}`,
      attempts,
      finalPrice: finalCheck?.price.daily,
      carData: finalCheck
    });
    
  } catch (error) {
    console.error('[REPAIR] Error:', error);
    return NextResponse.json({ 
      error: 'Repair operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
