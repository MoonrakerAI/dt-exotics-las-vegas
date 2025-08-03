import { NextResponse } from 'next/server';
import carDB from '../../../lib/car-database';
import aiKB from '../../../lib/ai-knowledge-base';
import { Car } from '../../../data/cars';

// Test car data
const TEST_CAR: Car = {
  id: 'test-car-kb-verification',
  brand: 'Ferrari',
  model: '488 GTB Test',
  year: 2024,
  category: 'Test Vehicle',
  stats: {
    horsepower: 661,
    torque: 561,
    topSpeed: 205,
    acceleration: 3.0,
    engine: '3.9L Twin-Turbo V8',
    drivetrain: 'RWD',
    doors: 2
  },
  features: [
    'Test Feature 1',
    'Test Feature 2',
    'Carbon Fiber Package',
    'Racing Seats',
    'Launch Control'
  ],
  price: {
    daily: 1999,
    weekly: 11999
  },
  images: {
    main: '/test/test-car.jpg',
    gallery: ['/test/test-car-1.jpg', '/test/test-car-2.jpg']
  },
  videos: {
    showcase: '/test/test-car-video.mp4'
  },
  audio: {
    startup: '/test/test-car-startup.mp3'
  },
  available: true,
  showOnHomepage: true
};

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export async function POST() {
  const results: TestResult[] = [];
  let testCarCreated = false;

  try {
    // Step 1: Get initial knowledge base state
    results.push({
      step: '1. Get Initial Knowledge Base',
      success: true,
      message: 'Getting initial knowledge base state...'
    });

    const initialKB = await aiKB.getKnowledgeBase();
    const initialFleetInfo = initialKB?.fleetInfo || '';
    const hasTestCarInitially = initialFleetInfo.includes('488 GTB Test');

    results.push({
      step: '1. Initial State Check',
      success: true,
      message: `Initial KB exists: ${!!initialKB}, Test car present: ${hasTestCarInitially}`,
      data: {
        kbExists: !!initialKB,
        testCarPresent: hasTestCarInitially,
        lastUpdated: initialKB?.lastUpdated
      }
    });

    // Step 2: Add test car to database
    results.push({
      step: '2. Add Test Car',
      success: true,
      message: 'Adding test car to database...'
    });

    const createdCar = await carDB.createCar(TEST_CAR);
    testCarCreated = true;

    results.push({
      step: '2. Car Creation',
      success: true,
      message: 'Test car added successfully',
      data: {
        carId: createdCar.id,
        brand: createdCar.brand,
        model: createdCar.model
      }
    });

    // Step 3: Wait a moment for async KB update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Verify knowledge base was updated
    results.push({
      step: '3. Verify KB Update',
      success: true,
      message: 'Checking if knowledge base was updated...'
    });

    const updatedKB = await aiKB.getKnowledgeBase();
    const updatedFleetInfo = updatedKB?.fleetInfo || '';
    const hasTestCarAfterUpdate = updatedFleetInfo.includes('488 GTB Test');
    const hasTestCarFeatures = updatedFleetInfo.includes('Test Feature 1');
    const hasTestCarPricing = updatedFleetInfo.includes('$1999/day');

    const kbUpdateSuccess = hasTestCarAfterUpdate && hasTestCarFeatures && hasTestCarPricing;

    results.push({
      step: '3. KB Update Verification',
      success: kbUpdateSuccess,
      message: kbUpdateSuccess 
        ? 'Knowledge base successfully updated with test car'
        : 'Knowledge base was not updated properly',
      data: {
        testCarPresent: hasTestCarAfterUpdate,
        featuresPresent: hasTestCarFeatures,
        pricingPresent: hasTestCarPricing,
        lastUpdated: updatedKB?.lastUpdated,
        fleetInfoLength: updatedFleetInfo.length
      }
    });

    // Step 5: Test AI system prompt generation
    results.push({
      step: '4. Test AI Prompt Generation',
      success: true,
      message: 'Testing AI system prompt generation...'
    });

    const systemPrompt = await aiKB.generateSystemPrompt();
    const promptIncludesTestCar = systemPrompt.includes('488 GTB Test');
    const promptIncludesFeatures = systemPrompt.includes('Test Feature 1');

    results.push({
      step: '4. AI Prompt Verification',
      success: promptIncludesTestCar && promptIncludesFeatures,
      message: promptIncludesTestCar && promptIncludesFeatures
        ? 'AI system prompt includes test car information'
        : 'AI system prompt missing test car information',
      data: {
        testCarInPrompt: promptIncludesTestCar,
        featuresInPrompt: promptIncludesFeatures,
        promptLength: systemPrompt.length
      }
    });

    // Step 6: Test fallback system
    results.push({
      step: '5. Test Fallback System',
      success: true,
      message: 'Testing fallback system...'
    });

    const fallbackPrompt = aiKB.getFallbackSystemPrompt();
    const fallbackWorks = fallbackPrompt.length > 0 && fallbackPrompt.includes('DT Exotics');

    results.push({
      step: '5. Fallback Verification',
      success: fallbackWorks,
      message: fallbackWorks 
        ? 'Fallback system working correctly'
        : 'Fallback system has issues',
      data: {
        fallbackLength: fallbackPrompt.length,
        includesBrand: fallbackPrompt.includes('DT Exotics')
      }
    });

  } catch (error) {
    results.push({
      step: 'Error',
      success: false,
      message: 'Test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Cleanup: Remove test car
  try {
    if (testCarCreated) {
      results.push({
        step: '6. Cleanup',
        success: true,
        message: 'Removing test car...'
      });

      const deleted = await carDB.deleteCar(TEST_CAR.id);
      
      results.push({
        step: '6. Cleanup Complete',
        success: deleted,
        message: deleted 
          ? 'Test car removed successfully'
          : 'Failed to remove test car',
        data: { deleted }
      });

      // Wait for KB update after deletion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify test car is removed from KB
      const finalKB = await aiKB.getKnowledgeBase();
      const finalFleetInfo = finalKB?.fleetInfo || '';
      const testCarStillPresent = finalFleetInfo.includes('488 GTB Test');

      results.push({
        step: '6. Final Verification',
        success: !testCarStillPresent,
        message: !testCarStillPresent
          ? 'Test car successfully removed from knowledge base'
          : 'Test car still present in knowledge base after deletion',
        data: {
          testCarStillPresent,
          finalLastUpdated: finalKB?.lastUpdated
        }
      });
    }
  } catch (cleanupError) {
    results.push({
      step: 'Cleanup Error',
      success: false,
      message: 'Failed to cleanup test car',
      error: cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error'
    });
  }

  // Calculate overall test success
  const successfulSteps = results.filter(r => r.success).length;
  const totalSteps = results.length;
  const overallSuccess = results.every(r => r.success);

  return NextResponse.json({
    success: overallSuccess,
    message: overallSuccess 
      ? 'All AI Knowledge Base tests passed successfully!'
      : `Some tests failed. ${successfulSteps}/${totalSteps} steps successful.`,
    summary: {
      totalSteps,
      successfulSteps,
      overallSuccess,
      testDuration: 'Approximately 3-4 seconds'
    },
    results
  });
}

// GET endpoint for test status/info
export async function GET() {
  try {
    const kb = await aiKB.getKnowledgeBase();
    const allCars = await carDB.getAllCars();
    
    return NextResponse.json({
      success: true,
      message: 'AI Knowledge Base test endpoint ready',
      currentState: {
        knowledgeBaseExists: !!kb,
        lastUpdated: kb?.lastUpdated,
        totalCarsInDB: allCars.length,
        availableCars: allCars.filter(car => car.available).length,
        testCarPresent: allCars.some(car => car.id === TEST_CAR.id)
      },
      instructions: {
        runTest: 'POST to this endpoint to run the full test suite',
        testSteps: [
          '1. Check initial knowledge base state',
          '2. Add test car to database',
          '3. Verify knowledge base auto-update',
          '4. Test AI system prompt generation',
          '5. Test fallback system',
          '6. Cleanup and final verification'
        ]
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to get test status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
