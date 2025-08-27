// Script to set initial display order for existing cars
// Run this once to establish the desired order: Lambos → R8 → Porsches → Corvette → Range Rover → Mercedes → Audis

const { kv } = require('@vercel/kv');

const desiredOrder = [
  // Lamborghinis first
  'lamborghini-h-2015',
  'lamborghini-aventador', 
  'lamborghini-gallardo',
  
  // R8
  'audi-r8',
  
  // Porsches  
  'porsche-911',
  'porsche-cayman',
  
  // Corvette
  'corvette-c8',
  
  // Range Rover
  'range-rover-sport',
  'land-rover-range-rover', 
  'range-rover-evoque',
  
  // Mercedes
  'mercedes-g550',
  'mercedes-glc',
  
  // Other Audis
  'audi-s5',
  'audi-sq8'
];

async function setInitialCarOrder() {
  try {
    console.log('Setting initial car display order...');
    
    // Get all car IDs from the database
    const carIds = await kv.smembers('cars:all');
    console.log('Found cars:', carIds);
    
    for (const carId of carIds) {
      // Get the car data
      const car = await kv.get(`car:${carId}`);
      if (!car) {
        console.log(`Car ${carId} not found, skipping...`);
        continue;
      }
      
      // Find the desired order index
      const orderIndex = desiredOrder.indexOf(carId);
      
      if (orderIndex !== -1) {
        // Car is in our desired order list
        const displayOrder = orderIndex + 1;
        const updatedCar = { ...car, displayOrder };
        
        await kv.set(`car:${carId}`, updatedCar);
        console.log(`Set ${carId} to display order ${displayOrder}`);
      } else {
        // Car is not in our list, give it a high order number
        const displayOrder = 1000 + (car.price?.daily || 0);
        const updatedCar = { ...car, displayOrder };
        
        await kv.set(`car:${carId}`, updatedCar);
        console.log(`Set ${carId} to display order ${displayOrder} (not in desired list)`);
      }
    }
    
    console.log('Initial car order set successfully!');
  } catch (error) {
    console.error('Error setting initial car order:', error);
  }
}

// Run the script
setInitialCarOrder();
