// Test script to verify API Ninja integration
// Run with: node test-api-ninja.js

const https = require('https');

// Test API Ninja integration
async function testAPINinja() {
  console.log('🔍 Testing API Ninja Integration...\n');

  // Check if API key is configured
  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    console.log('❌ API_NINJAS_KEY environment variable not set');
    console.log('📝 To fix this:');
    console.log('   1. Get a free API key from https://api.api-ninjas.com/');
    console.log('   2. Add API_NINJAS_KEY=your_key_here to your .env.local file');
    return;
  }

  console.log('✅ API_NINJAS_KEY is configured');

  // Test API Ninja with a few popular cars
  const testCars = [
    { make: 'Lamborghini', model: 'Huracan', year: 2023 },
    { make: 'Ferrari', model: '488', year: 2022 },
    { make: 'Porsche', model: '911', year: 2023 },
    { make: 'Tesla', model: 'Model S', year: 2023 }
  ];

  for (const car of testCars) {
    await testVehicleLookup(car.year, car.make, car.model, apiKey);
  }
}

function testVehicleLookup(year, make, model, apiKey) {
  return new Promise((resolve) => {
    const params = new URLSearchParams({
      make: make.trim(),
      model: model.trim(),
      year: year.toString()
    });

    const url = `https://api.api-ninjas.com/v1/cars?${params}`;
    
    console.log(`\n🚗 Testing: ${year} ${make} ${model}`);
    
    const req = https.get(url, {
      headers: {
        'X-Api-Key': apiKey
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            
            if (result && result.length > 0) {
              const vehicle = result[0];
              console.log('✅ API Response received');
              console.log(`   Make: ${vehicle.make || 'N/A'}`);
              console.log(`   Model: ${vehicle.model || 'N/A'}`);
              console.log(`   Year: ${vehicle.year || 'N/A'}`);
              console.log(`   Engine: ${vehicle.engine_type || 'N/A'}`);
              console.log(`   Horsepower: ${vehicle.horsepower || 'N/A'}`);
              console.log(`   Top Speed: ${vehicle.top_speed ? `${vehicle.top_speed} km/h (${Math.round(vehicle.top_speed * 0.621371)} MPH)` : 'N/A'}`);
              console.log(`   Fuel Type: ${vehicle.fuel_type || 'N/A'}`);
              console.log(`   Transmission: ${vehicle.transmission || 'N/A'}`);
              console.log(`   Drive: ${vehicle.drive || 'N/A'}`);
            } else {
              console.log('⚠️  No data found for this vehicle');
            }
          } else if (res.statusCode === 401) {
            console.log('❌ Authentication failed - check API key');
          } else if (res.statusCode === 429) {
            console.log('⚠️  Rate limit exceeded - try again later');
          } else {
            console.log(`❌ API error: ${res.statusCode}`);
          }
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log('❌ Request timeout');
      req.destroy();
      resolve();
    });
  });
}

// Test vehicle suggestions (NHTSA API - free)
async function testVehicleSuggestions() {
  console.log('\n\n🔍 Testing Vehicle Suggestions (NHTSA API)...\n');
  
  const testMakes = ['Lamborghini', 'Ferrari', 'Porsche', 'BMW'];
  
  for (const make of testMakes) {
    await testMakeSuggestions(make);
  }
}

function testMakeSuggestions(make) {
  return new Promise((resolve) => {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json`;
    
    console.log(`🔍 Testing make suggestions for: "${make}"`);
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result && result.Results) {
            const makes = result.Results.map(m => m.Make_Name);
            const makeLower = make.toLowerCase();
            const suggestions = makes.filter(m => 
              m.toLowerCase().includes(makeLower)
            ).slice(0, 5);
            
            if (suggestions.length > 0) {
              console.log('✅ NHTSA API working');
              console.log(`   Suggestions: ${suggestions.join(', ')}`);
            } else {
              console.log('⚠️  No suggestions found');
            }
          } else {
            console.log('❌ Invalid response from NHTSA API');
          }
        } catch (error) {
          console.log('❌ Error parsing NHTSA response:', error.message);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ NHTSA request failed:', error.message);
      resolve();
    });

    req.setTimeout(10000, () => {
      console.log('❌ NHTSA request timeout');
      req.destroy();
      resolve();
    });
  });
}

// Run tests
async function runTests() {
  console.log('🚀 DT Exotics Vehicle API Integration Test\n');
  console.log('=' .repeat(50));
  
  await testAPINinja();
  await testVehicleSuggestions();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Test completed!');
  console.log('\n📋 Summary:');
  console.log('   • API Ninja: Premium vehicle data with detailed specs');
  console.log('   • NHTSA API: Free vehicle make/model suggestions');
  console.log('   • Speed Conversion: All speeds now stored in MPH');
  console.log('\n🔧 Next Steps:');
  console.log('   1. Ensure API_NINJAS_KEY is set in production');
  console.log('   2. Test auto-populate in fleet management');
  console.log('   3. Verify speed units display correctly to clients');
}

runTests().catch(console.error);
