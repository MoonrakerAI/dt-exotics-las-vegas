import { Car } from '../data/cars';

/**
 * Calculate deposit amount based on daily rate
 * - Cars under $500/day: $500 flat deposit
 * - Cars $500/day and above: $1000 flat deposit
 */
export function calculateDepositAmount(dailyRate: number): number {
  return dailyRate < 500 ? 500 : 1000;
}

export function calculateRentalPricing(car: Car, startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate total days
  const timeDiff = end.getTime() - start.getTime();
  const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // Calculate subtotal
  const subtotal = totalDays * car.price.daily;
  
  // Calculate deposit using tiered flat-rate system
  const depositAmount = calculateDepositAmount(car.price.daily);
  
  // Final amount is remaining balance
  const finalAmount = subtotal - depositAmount;
  
  return {
    dailyRate: car.price.daily,
    totalDays,
    subtotal,
    depositAmount,
    finalAmount
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function validateRentalDates(startDate: string, endDate: string): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // Check if start date is in the future
  if (start <= now) {
    return { valid: false, error: 'Start date must be in the future' };
  }
  
  // Check if end date is after start date
  if (end <= start) {
    return { valid: false, error: 'End date must be after start date' };
  }
  
  // Check minimum rental period (1 day)
  const timeDiff = end.getTime() - start.getTime();
  const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (days < 1) {
    return { valid: false, error: 'Minimum rental period is 1 day' };
  }
  
  // Check maximum rental period (30 days)
  if (days > 30) {
    return { valid: false, error: 'Maximum rental period is 30 days' };
  }
  
  return { valid: true };
}

export function generateRentalId(): string {
  return 'rental_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}