import { kv } from '@vercel/kv';
import { Car } from '../app/data/cars';

async function repairCarKV() {
  try {
    console.log('=== Repairing Car KV Storage ===');
    
    // Get all car IDs from the set
    const carIds = await kv.smembers('cars:all');
    console.log(`Found ${carIds.length} car IDs in set:`, carIds);
    
    let repaired = 0;
    let missing = 0;
    
    for (const carId of carIds) {
      console.log(`\nChecking car: ${carId}`);
      
      // Check if individual car key exists
      const car = await kv.get<Car>(`car:${carId}`);
      
      if (!car) {
        console.log(`❌ Missing individual key for: ${carId}`);
        missing++;
        
        // Try to find car data from static data or reconstruct
        if (carId === 'land-rover-d-2019') {
          console.log('🔧 Reconstructing Land Rover Discovery data...');
          
          const landRoverData: Car = {
            id: 'land-rover-d-2019',
            brand: 'Land Rover',
            model: 'Discovery',
            year: 2019,
            category: 'luxury',
            price: {
              daily: 300,
              weekly: 1800
            },
            stats: {
              horsepower: 254,
              torque: 269,
              topSpeed: 130,
              acceleration: 7.7,
              engine: '2.0L Turbo I4',
              drivetrain: 'AWD (All-Wheel Drive)',
              doors: 4
            },
            features: [],
            images: {
              main: '/cars/Land Rover Discovery 2019 (White)/main.jpg',
              gallery: [
                '/cars/Land Rover Discovery 2019 (White)/gallery-1.jpg',
                '/cars/Land Rover Discovery 2019 (White)/gallery-2.jpg',
                '/cars/Land Rover Discovery 2019 (White)/gallery-3.jpg'
              ]
            },
            videos: {
              showcase: [],
              youtube: []
            },
            audio: {
              startup: '',
              rev: ''
            },
            available: true,
            showOnHomepage: true,
            displayOrder: 1
          };
          
          // Store the reconstructed car data
          await kv.set(`car:${carId}`, landRoverData);
          console.log(`✅ Reconstructed and stored: ${carId}`);
          repaired++;
        } else {
          console.log(`⚠️  Cannot reconstruct data for: ${carId} - manual intervention needed`);
        }
      } else {
        console.log(`✅ Found individual key for: ${carId}`);
      }
    }
    
    console.log('\n=== Repair Summary ===');
    console.log(`Total cars in set: ${carIds.length}`);
    console.log(`Missing individual keys: ${missing}`);
    console.log(`Repaired: ${repaired}`);
    
    // Verify the repair
    if (repaired > 0) {
      console.log('\n=== Verification ===');
      for (const carId of carIds) {
        const car = await kv.get<Car>(`car:${carId}`);
        console.log(`${carId}: ${car ? '✅ OK' : '❌ Still missing'}`);
      }
    }
    
  } catch (error) {
    console.error('Error repairing KV data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the repair
repairCarKV();
