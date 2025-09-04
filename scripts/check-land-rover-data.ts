import { kv } from '@vercel/kv';
import carDB from '../app/lib/car-database';

async function checkLandRoverData() {
  try {
    console.log('=== Checking Land Rover Discovery Data ===');
    
    const carId = 'land-rover-d-2019';
    
    // 1. Direct KV lookup
    console.log('\n1. Direct KV Storage Lookup:');
    const directCar = await kv.get(`car:${carId}`);
    if (directCar) {
      console.log(`✅ Found in KV storage`);
      console.log(`Price: Daily $${(directCar as any).price?.daily}, Weekly $${(directCar as any).price?.weekly}`);
      console.log(`Available: ${(directCar as any).available}`);
      console.log(`Show on Homepage: ${(directCar as any).showOnHomepage}`);
    } else {
      console.log(`❌ Not found in direct KV lookup`);
    }
    
    // 2. Car Database getCar method
    console.log('\n2. Car Database getCar Method:');
    const dbCar = await carDB.getCar(carId);
    if (dbCar) {
      console.log(`✅ Found via carDB.getCar`);
      console.log(`Price: Daily $${dbCar.price.daily}, Weekly $${dbCar.price.weekly}`);
      console.log(`Available: ${dbCar.available}`);
      console.log(`Show on Homepage: ${dbCar.showOnHomepage}`);
    } else {
      console.log(`❌ Not found via carDB.getCar`);
    }
    
    // 3. Car Database getAllCars method
    console.log('\n3. Car Database getAllCars Method:');
    const allCars = await carDB.getAllCars();
    const foundInAll = allCars.find(car => car.id === carId);
    if (foundInAll) {
      console.log(`✅ Found in getAllCars`);
      console.log(`Price: Daily $${foundInAll.price.daily}, Weekly $${foundInAll.price.weekly}`);
      console.log(`Available: ${foundInAll.available}`);
      console.log(`Show on Homepage: ${foundInAll.showOnHomepage}`);
    } else {
      console.log(`❌ Not found in getAllCars`);
    }
    
    // 4. Check if car is in the cars:all set
    console.log('\n4. Cars Set Membership:');
    const carIds = await kv.smembers('cars:all');
    const inSet = carIds.includes(carId);
    console.log(`Car in 'cars:all' set: ${inSet ? '✅ Yes' : '❌ No'}`);
    console.log(`Total cars in set: ${carIds.length}`);
    
    // 5. Compare with static data
    console.log('\n5. Static Data Comparison:');
    try {
      const { cars } = await import('../app/data/cars');
      const staticCar = cars.find(car => car.id === carId);
      if (staticCar) {
        console.log(`✅ Found in static data`);
        console.log(`Static Price: Daily $${staticCar.price.daily}, Weekly $${staticCar.price.weekly}`);
        console.log(`Static Available: ${staticCar.available}`);
        console.log(`Static Show on Homepage: ${staticCar.showOnHomepage}`);
      } else {
        console.log(`❌ Not found in static data`);
      }
    } catch (error) {
      console.log(`⚠️  Could not load static data: ${error}`);
    }
    
    console.log('\n=== Summary ===');
    console.log('If prices differ between KV storage and what you see in the UI,');
    console.log('there may be a caching issue or the frontend is using static data.');
    
  } catch (error) {
    console.error('Error checking Land Rover data:', error);
  } finally {
    process.exit(0);
  }
}

checkLandRoverData();
