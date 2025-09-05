// Simple script to force update the Land Rover Discovery price
// Run this in the browser console on the admin fleet page

async function forcePriceUpdate() {
  const token = localStorage.getItem('dt-admin-token');
  if (!token) {
    console.error('No admin token found');
    return;
  }

  console.log('🔧 Starting force price update...');
  
  try {
    // Call the repair endpoint
    const response = await fetch('/api/admin/repair-land-rover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newPrice: 350 })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Repair successful:', result);
      
      // Force refresh the page data
      console.log('🔄 Refreshing page data...');
      window.location.reload();
    } else {
      console.error('❌ Repair failed:', result);
    }
  } catch (error) {
    console.error('❌ Error during repair:', error);
  }
}

// Run the repair
forcePriceUpdate();
