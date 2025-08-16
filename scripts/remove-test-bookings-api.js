// Script to identify and remove test bookings via API
// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:3004';
const ADMIN_TOKEN = 'dev-admin-token'; // Development token

async function removeTestBookings() {
  try {
    console.log('Fetching all rental bookings via API...');
    
    // Fetch all rentals via API
    const response = await fetch(`${API_BASE}/api/admin/rentals`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const rentals = data.data || [];
    
    console.log(`Found ${rentals.length} total bookings`);
    
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
    
    // Check if these look like test bookings
    const isTestBooking = (rental) => {
      const testIndicators = [
        rental.customer.email.includes('test'),
        rental.customer.firstName.toLowerCase().includes('test'),
        rental.customer.lastName.toLowerCase().includes('test'),
        rental.customer.email.includes('example'),
        rental.customer.email.includes('demo'),
        rental.pricing.finalAmount < 100, // Very low amounts might be test
        rental.customer.email.includes('stripe'), // Stripe test emails
      ];
      return testIndicators.some(indicator => indicator);
    };
    
    console.log('Analyzing if these are test bookings...');
    const testBookings = [];
    firstTwoBookings.forEach((rental, index) => {
      const isTest = isTestBooking(rental);
      console.log(`Booking ${index + 1}: ${isTest ? 'LIKELY TEST BOOKING' : 'Might be real booking'}`);
      if (isTest) {
        testBookings.push(rental);
      }
    });
    
    if (testBookings.length > 0) {
      console.log(`\nFound ${testBookings.length} test booking(s) to remove:`);
      testBookings.forEach((rental, index) => {
        console.log(`${index + 1}. ${rental.customer.firstName} ${rental.customer.lastName} (${rental.customer.email})`);
      });
      
      // Delete the test bookings
      console.log('\nRemoving test bookings...');
      for (const rental of testBookings) {
        try {
          const deleteResponse = await fetch(`${API_BASE}/api/admin/rentals/${rental.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ Successfully removed booking: ${rental.id.slice(0, 8)}... (${rental.customer.firstName} ${rental.customer.lastName})`);
          } else {
            console.log(`❌ Failed to remove booking: ${rental.id.slice(0, 8)}... - ${deleteResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Error removing booking ${rental.id.slice(0, 8)}...: ${error.message}`);
        }
      }
    } else {
      console.log('\nNo obvious test bookings found in the first two entries.');
      console.log('Manual review may be needed to identify test bookings.');
    }
    
    console.log('\nScript completed.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
removeTestBookings();
