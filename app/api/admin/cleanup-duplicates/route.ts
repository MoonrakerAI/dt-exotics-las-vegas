import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { verifyJWT } from '@/app/lib/auth';
import { Car } from '@/app/data/cars';

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

    console.log('[CLEANUP] Starting duplicate cleanup for Land Rover Discovery');
    
    // Step 1: Get all car IDs from the set
    const allCarIds = await kv.smembers('cars:all');
    console.log('[CLEANUP] All car IDs:', allCarIds);
    
    // Step 2: Find all Land Rover Discovery entries
    const landRoverEntries: { id: string; car: Car }[] = [];
    
    for (const carId of allCarIds) {
      try {
        const car = await kv.get<Car>(`car:${carId}`);
        if (car && car.brand === 'Land Rover' && car.model === 'Discovery') {
          landRoverEntries.push({ id: carId, car });
          console.log(`[CLEANUP] Found Land Rover Discovery: ${carId} - $${car.price.daily}`);
        }
      } catch (error) {
        console.log(`[CLEANUP] Error checking car ${carId}:`, error);
      }
    }
    
    if (landRoverEntries.length === 0) {
      return NextResponse.json({ error: 'No Land Rover Discovery entries found' }, { status: 404 });
    }
    
    if (landRoverEntries.length === 1) {
      return NextResponse.json({ 
        message: 'Only one Land Rover Discovery found, no duplicates to clean',
        entry: landRoverEntries[0]
      });
    }
    
    console.log(`[CLEANUP] Found ${landRoverEntries.length} Land Rover Discovery entries`);
    
    // Step 3: Keep the one with the higher price ($350) and remove others
    const correctEntry = landRoverEntries.find(entry => entry.car.price.daily === 350);
    const duplicatesToRemove = landRoverEntries.filter(entry => entry.car.price.daily !== 350);
    
    if (!correctEntry) {
      return NextResponse.json({ 
        error: 'No entry with $350 price found',
        entries: landRoverEntries.map(e => ({ id: e.id, price: e.car.price.daily }))
      }, { status: 400 });
    }
    
    console.log(`[CLEANUP] Keeping entry: ${correctEntry.id} ($${correctEntry.car.price.daily})`);
    console.log(`[CLEANUP] Removing ${duplicatesToRemove.length} duplicates`);
    
    // Step 4: Remove duplicates
    const removedEntries = [];
    for (const duplicate of duplicatesToRemove) {
      try {
        // Remove from KV storage
        await kv.del(`car:${duplicate.id}`);
        
        // Remove from cars:all set
        await kv.srem('cars:all', duplicate.id);
        
        removedEntries.push({
          id: duplicate.id,
          price: duplicate.car.price.daily
        });
        
        console.log(`[CLEANUP] Removed duplicate: ${duplicate.id} ($${duplicate.car.price.daily})`);
      } catch (error) {
        console.error(`[CLEANUP] Error removing ${duplicate.id}:`, error);
      }
    }
    
    // Step 5: Verify cleanup
    const finalCarIds = await kv.smembers('cars:all');
    const remainingLandRovers = [];
    
    for (const carId of finalCarIds) {
      try {
        const car = await kv.get<Car>(`car:${carId}`);
        if (car && car.brand === 'Land Rover' && car.model === 'Discovery') {
          remainingLandRovers.push({ id: carId, price: car.price.daily });
        }
      } catch (error) {
        console.log(`[CLEANUP] Error verifying car ${carId}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Duplicate cleanup completed',
      keptEntry: {
        id: correctEntry.id,
        price: correctEntry.car.price.daily
      },
      removedEntries,
      remainingLandRovers,
      totalRemaining: remainingLandRovers.length
    });
    
  } catch (error) {
    console.error('[CLEANUP] Error:', error);
    return NextResponse.json({ 
      error: 'Cleanup operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
