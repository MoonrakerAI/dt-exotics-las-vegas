/**
 * Test script to verify tiered deposit calculations
 * Run with: node scripts/test-deposit-calculation.js
 */

// Simulate the calculateDepositAmount function
function calculateDepositAmount(dailyRate) {
  return dailyRate < 500 ? 500 : 1000;
}

// Test cases
const testCases = [
  { car: 'Land Rover Discovery', dailyRate: 400, expectedDeposit: 500 },
  { car: 'Dodge Hellcat', dailyRate: 450, expectedDeposit: 500 },
  { car: 'Audi R8', dailyRate: 499, expectedDeposit: 500 },
  { car: 'Corvette C8', dailyRate: 599, expectedDeposit: 1000 },
  { car: 'Lamborghini Huracán', dailyRate: 1399, expectedDeposit: 1000 },
  { car: 'Edge case - exactly $500', dailyRate: 500, expectedDeposit: 1000 },
];

console.log('='.repeat(70));
console.log('TIERED DEPOSIT CALCULATION TEST');
console.log('='.repeat(70));
console.log('\nDeposit Rules:');
console.log('  • Cars under $500/day: $500 flat deposit');
console.log('  • Cars $500/day and above: $1000 flat deposit\n');
console.log('='.repeat(70));

let allPassed = true;

testCases.forEach((test, index) => {
  const actualDeposit = calculateDepositAmount(test.dailyRate);
  const passed = actualDeposit === test.expectedDeposit;
  allPassed = allPassed && passed;
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\nTest ${index + 1}: ${test.car}`);
  console.log(`  Daily Rate: $${test.dailyRate}`);
  console.log(`  Expected Deposit: $${test.expectedDeposit}`);
  console.log(`  Actual Deposit: $${actualDeposit}`);
  console.log(`  ${status}`);
});

console.log('\n' + '='.repeat(70));
console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
console.log('='.repeat(70));

// Example rental calculation
console.log('\n\nEXAMPLE RENTAL CALCULATIONS:');
console.log('='.repeat(70));

const exampleRentals = [
  { car: 'Land Rover Discovery ($400/day)', dailyRate: 400, days: 3 },
  { car: 'Corvette C8 ($599/day)', dailyRate: 599, days: 3 },
  { car: 'Lamborghini Huracán ($1399/day)', dailyRate: 1399, days: 3 },
];

exampleRentals.forEach(rental => {
  const subtotal = rental.dailyRate * rental.days;
  const deposit = calculateDepositAmount(rental.dailyRate);
  const balanceDue = subtotal - deposit;
  
  console.log(`\n${rental.car} - ${rental.days} days:`);
  console.log(`  Subtotal: $${subtotal}`);
  console.log(`  Deposit: $${deposit}`);
  console.log(`  Balance Due at Pickup: $${balanceDue}`);
});

console.log('\n' + '='.repeat(70));
