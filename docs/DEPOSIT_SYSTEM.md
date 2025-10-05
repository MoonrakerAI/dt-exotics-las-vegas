# Tiered Deposit System

## Overview
The rental deposit system has been updated from a percentage-based model (30% of total) to a tiered flat-rate system based on the daily rental price.

## Deposit Structure

| Daily Rate | Deposit Amount |
|------------|----------------|
| Under $500/day | $500 flat |
| $500/day and above | $1,000 flat |

## Implementation Details

### Core Logic
The deposit calculation is centralized in `/app/lib/rental-utils.ts`:

```typescript
export function calculateDepositAmount(dailyRate: number): number {
  return dailyRate < 500 ? 500 : 1000;
}
```

### Files Modified

1. **`/app/lib/rental-utils.ts`**
   - Added `calculateDepositAmount()` function
   - Updated `calculateRentalPricing()` to use tiered deposits

2. **`/app/book-rental/page.tsx`**
   - Updated all deposit calculations to use `calculateDepositAmount()`
   - Removed "30%" label from deposit display
   - Three instances updated (initial calculation, handleInputChange, and inline calculation)

3. **`/app/api/admin/rentals/[id]/reschedule/route.ts`**
   - Updated reschedule pricing to use tiered deposit logic

4. **`/app/api/rentals/create-deposit-intent/route.ts`**
   - Automatically uses new logic via `calculateRentalPricing()` import

### Test Results

All test cases passed successfully:

```
✅ Land Rover Discovery ($400/day) → $500 deposit
✅ Dodge Hellcat ($450/day) → $500 deposit  
✅ Audi R8 ($499/day) → $500 deposit
✅ Corvette C8 ($599/day) → $1,000 deposit
✅ Lamborghini Huracán ($1,399/day) → $1,000 deposit
✅ Edge case ($500/day exactly) → $1,000 deposit
```

## Example Calculations

### Lower-Tier Car (Land Rover Discovery - $400/day)
- 3-day rental: $1,200 total
- Deposit: **$500**
- Balance due at pickup: $700

### Higher-Tier Car (Corvette C8 - $599/day)
- 3-day rental: $1,797 total
- Deposit: **$1,000**
- Balance due at pickup: $797

### Premium Car (Lamborghini Huracán - $1,399/day)
- 3-day rental: $4,197 total
- Deposit: **$1,000**
- Balance due at pickup: $3,197

## Benefits

1. **Predictable Deposits**: Customers know exactly what to expect
2. **Simplified Pricing**: Easier to communicate and understand
3. **Fair for Lower-Priced Cars**: $500 flat is more reasonable than 30% of a small total
4. **Consistent for Premium Cars**: $1,000 provides adequate security without being excessive

## Backward Compatibility

- Existing bookings retain their original deposit amounts
- New bookings automatically use the tiered system
- Rescheduled bookings recalculate using the new system

## Testing

Run the test script to verify calculations:
```bash
node scripts/test-deposit-calculation.js
```

## Future Considerations

If needed, the tier structure can be easily modified by updating the `calculateDepositAmount()` function. Consider:
- Adding more tiers (e.g., ultra-luxury cars)
- Adjusting threshold amounts
- Adding seasonal variations
