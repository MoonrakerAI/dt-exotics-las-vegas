// Utility script to identify and remove the first two test payment bookings
// This script will connect to the KV database and remove test bookings

const { kv } = require('@vercel/kv');

async function removeTestBookings() {
  try {
    console.log('Fetching all rental bookings...');
    
    // Get all rental IDs
    const rentalIds = await kv.smembers('rentals:all');
    console.log(`Found ${rentalIds.length} total bookings`);
    
    // Fetch all rentals
    const rentals = [];
    for (const id of rentalIds) {
      const rental = await kv.get(`rental:${id}`);
      if (rental) {
        rentals.push(rental);
      }
    }
    
    // Sort by creation date (oldest first) to identify the first two test bookings
    rentals.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    console.log('\nAll bookings (sorted by creation date):');
    rentals.forEach((rental, index) => {
      console.log(`${index + 1}. ID: ${rental.id.slice(0, 8)}... | Created: ${rental.createdAt} | Customer: ${rental.customer.firstName} ${rental.customer.lastName} | Car: ${rental.car.brand} ${rental.car.model} | Status: ${rental.status}`);
    });
    
    // Identify the first two bookings (likely test bookings)
    const firstTwoBookings = rentals.slice(0, 2);
    
    console.log('\nFirst two bookings (candidates for removal):');
    firstTwoBookings.forEach((rental, index) => {
      console.log(`${index + 1}. ID: ${rental.id}`);
      console.log(`   Customer: ${rental.customer.firstName} ${rental.customer.lastName}`);
      console.log(`   Email: ${rental.customer.email}`);
      console.log(`   Car: ${rental.car.brand} ${rental.car.model}`);
      console.log(`   Created: ${rental.createdAt}`);
      console.log(`   Status: ${rental.status}`);
      console.log(`   Amount: $${rental.pricing.finalAmount}`);
      console.log('');
    });
    
    // Check if these look like test bookings (you can modify this logic)
    const isTestBooking = (rental) => {
      const testIndicators = [
        rental.customer.email.includes('test'),
        rental.customer.firstName.toLowerCase().includes('test'),
        rental.customer.lastName.toLowerCase().includes('test'),
        rental.customer.email.includes('example'),
        rental.customer.email.includes('demo'),
        rental.pricing.finalAmount < 100, // Very low amounts might be test
      ];
      return testIndicators.some(indicator => indicator);
    };
    
    console.log('Analyzing if these are test bookings...');
    firstTwoBookings.forEach((rental, index) => {
      const isTest = isTestBooking(rental);
      console.log(`Booking ${index + 1}: ${isTest ? 'LIKELY TEST BOOKING' : 'Might be real booking'}`);
    });
    
    // For safety, let's not auto-delete. Instead, show what would be deleted
    console.log('\nTo remove these bookings, the following would be deleted:');
    firstTwoBookings.forEach((rental, index) => {
      console.log(`${index + 1}. Rental ID: ${rental.id}`);
    });
    
    console.log('\nScript completed. Review the output above to confirm which bookings should be removed.');
    console.log('If you want to proceed with deletion, modify this script to actually delete the bookings.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
removeTestBookings();
