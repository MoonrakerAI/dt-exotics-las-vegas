import { NextRequest, NextResponse } from 'next/server';
import { vehicleAPI } from '@/app/lib/vehicle-api';

// GET: Test API Ninja integration and environment variables
export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    const apiKey = process.env.API_NINJAS_KEY;
    
    const testResult: {
      timestamp: string;
      environment: string;
      apiKeyConfigured: boolean;
      apiKeyLength: number;
      apiKeyPreview: string;
      tests: any[];
      summary?: any;
    } = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'Not set',
      tests: []
    };

    // Test 1: Environment variable check
    testResult.tests.push({
      name: 'Environment Variable Check',
      status: apiKey ? 'PASS' : 'FAIL',
      message: apiKey ? 'API_NINJAS_KEY is configured' : 'API_NINJAS_KEY is not set',
      details: {
        keyLength: apiKey ? apiKey.length : 0,
        keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : null
      }
    });

    // Test 2: Vehicle API service test (if API key is available)
    if (apiKey) {
      try {
        console.log('Testing API Ninja with Lamborghini Huracan...');
        const vehicleTest = await vehicleAPI.lookupVehicle(2023, 'Lamborghini', 'Huracan');
        
        testResult.tests.push({
          name: 'Vehicle Lookup Test (Lamborghini Huracan 2023)',
          status: vehicleTest.success ? 'PASS' : 'FAIL',
          message: vehicleTest.success ? 'Vehicle data retrieved successfully' : vehicleTest.error || 'Unknown error',
          details: vehicleTest.success ? {
            make: vehicleTest.data?.make,
            model: vehicleTest.data?.model,
            year: vehicleTest.data?.year,
            horsepower: vehicleTest.data?.horsepower,
            topSpeed: vehicleTest.data?.topSpeed,
            engine: vehicleTest.data?.engine,
            category: vehicleTest.data?.category
          } : null
        });
      } catch (error) {
        testResult.tests.push({
          name: 'Vehicle Lookup Test (Lamborghini Huracan 2023)',
          status: 'ERROR',
          message: `Error during vehicle lookup: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: null
        });
      }

      // Test 3: Direct API Ninja call
      try {
        console.log('Testing direct API Ninja call...');
        const params = new URLSearchParams({
          make: 'Ferrari',
          model: '488',
          year: '2022'
        });

        const response = await fetch(`https://api.api-ninjas.com/v1/cars?${params}`, {
          headers: {
            'X-Api-Key': apiKey
          }
        });

        const directApiData = await response.json();
        
        testResult.tests.push({
          name: 'Direct API Ninja Call (Ferrari 488 2022)',
          status: response.ok ? 'PASS' : 'FAIL',
          message: response.ok ? 'Direct API call successful' : `API returned ${response.status}`,
          details: response.ok ? {
            responseStatus: response.status,
            dataLength: Array.isArray(directApiData) ? directApiData.length : 0,
            firstResult: Array.isArray(directApiData) && directApiData.length > 0 ? {
              make: directApiData[0].make,
              model: directApiData[0].model,
              year: directApiData[0].year,
              horsepower: directApiData[0].horsepower,
              topSpeed: directApiData[0].top_speed
            } : null
          } : {
            responseStatus: response.status,
            error: directApiData
          }
        });
      } catch (error) {
        testResult.tests.push({
          name: 'Direct API Ninja Call (Ferrari 488 2022)',
          status: 'ERROR',
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: null
        });
      }
    } else {
      testResult.tests.push({
        name: 'API Tests Skipped',
        status: 'SKIP',
        message: 'API_NINJAS_KEY not configured, skipping API tests',
        details: null
      });
    }

    // Test 4: Vehicle suggestions (NHTSA - should always work)
    try {
      console.log('Testing vehicle suggestions...');
      const suggestions = await vehicleAPI.getVehicleSuggestions('Lamborghini');
      
      testResult.tests.push({
        name: 'Vehicle Suggestions Test (NHTSA API)',
        status: suggestions.makes.length > 0 ? 'PASS' : 'FAIL',
        message: suggestions.makes.length > 0 ? 'Vehicle suggestions working' : 'No suggestions returned',
        details: {
          makeSuggestions: suggestions.makes.slice(0, 3),
          totalMakes: suggestions.makes.length
        }
      });
    } catch (error) {
      testResult.tests.push({
        name: 'Vehicle Suggestions Test (NHTSA API)',
        status: 'ERROR',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: null
      });
    }

    // Summary
    const passCount = testResult.tests.filter(t => t.status === 'PASS').length;
    const totalTests = testResult.tests.filter(t => t.status !== 'SKIP').length;
    
    testResult.summary = {
      totalTests,
      passed: passCount,
      failed: totalTests - passCount,
      overallStatus: passCount === totalTests ? 'ALL_PASS' : 'SOME_FAIL'
    };

    return NextResponse.json(testResult, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('API Ninja test error:', error);
    return NextResponse.json({ 
      error: 'Test endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
