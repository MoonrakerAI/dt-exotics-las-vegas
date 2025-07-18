// Persistent database using Vercel KV (Redis)
// This replaces the in-memory database with persistent storage

import { kv } from '@vercel/kv';
import { RentalBooking } from '../types/rental';

class KVRentalDatabase {
  // Key prefixes for organization
  private readonly RENTAL_PREFIX = 'rental:';
  private readonly CUSTOMER_PREFIX = 'customer:';
  private readonly PAYMENT_INTENT_PREFIX = 'payment:';
  private readonly RENTAL_LIST_KEY = 'rentals:all';
  private readonly CUSTOMER_RENTALS_PREFIX = 'customer_rentals:';

  async createRental(rental: RentalBooking): Promise<RentalBooking> {
    // Store the rental
    await kv.set(this.RENTAL_PREFIX + rental.id, rental);
    
    // Add to rental list for easy retrieval
    await kv.sadd(this.RENTAL_LIST_KEY, rental.id);
    
    // Track customer rentals
    const customerRentalsKey = this.CUSTOMER_RENTALS_PREFIX + rental.customerId;
    await kv.sadd(customerRentalsKey, rental.id);
    
    // Index by payment intent for webhook lookups
    if (rental.payment.depositPaymentIntentId) {
      await kv.set(
        this.PAYMENT_INTENT_PREFIX + rental.payment.depositPaymentIntentId, 
        rental.id
      );
    }
    
    return rental;
  }

  async getRental(rentalId: string): Promise<RentalBooking | null> {
    const rental = await kv.get<RentalBooking>(this.RENTAL_PREFIX + rentalId);
    return rental || null;
  }

  async updateRental(rentalId: string, updates: Partial<RentalBooking>): Promise<RentalBooking | null> {
    const existing = await this.getRental(rentalId);
    if (!existing) return null;

    const updatedRental: RentalBooking = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await kv.set(this.RENTAL_PREFIX + rentalId, updatedRental);

    // Update payment intent index if it changed
    if (updates.payment?.finalPaymentIntentId && 
        updates.payment.finalPaymentIntentId !== existing.payment.finalPaymentIntentId) {
      await kv.set(
        this.PAYMENT_INTENT_PREFIX + updates.payment.finalPaymentIntentId, 
        rentalId
      );
    }

    return updatedRental;
  }

  async getRentalsByCustomer(customerId: string): Promise<RentalBooking[]> {
    const customerRentalsKey = this.CUSTOMER_RENTALS_PREFIX + customerId;
    const rentalIds = await kv.smembers(customerRentalsKey);
    
    if (rentalIds.length === 0) return [];

    // Get all rentals for this customer
    const rentals: RentalBooking[] = [];
    for (const id of rentalIds) {
      const rental = await this.getRental(id as string);
      if (rental) rentals.push(rental);
    }

    return rentals;
  }

  async getRentalByPaymentIntent(paymentIntentId: string): Promise<RentalBooking | null> {
    const rentalId = await kv.get<string>(this.PAYMENT_INTENT_PREFIX + paymentIntentId);
    if (!rentalId) return null;
    
    return await this.getRental(rentalId);
  }

  async getAllRentals(): Promise<RentalBooking[]> {
    const rentalIds = await kv.smembers(this.RENTAL_LIST_KEY);
    
    if (rentalIds.length === 0) return [];

    // Get all rentals
    const rentals: RentalBooking[] = [];
    for (const id of rentalIds) {
      const rental = await this.getRental(id as string);
      if (rental) rentals.push(rental);
    }

    return rentals;
  }

  async getRentalsByStatus(status: RentalBooking['status']): Promise<RentalBooking[]> {
    const allRentals = await this.getAllRentals();
    return allRentals.filter(rental => rental.status === status);
  }

  async getRentalsByDateRange(startDate: string, endDate: string): Promise<RentalBooking[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const allRentals = await this.getAllRentals();
    
    return allRentals.filter(rental => {
      const rentalStart = new Date(rental.rentalDates.startDate);
      const rentalEnd = new Date(rental.rentalDates.endDate);
      
      // Check if rental dates overlap with query range
      return (rentalStart <= end && rentalEnd >= start);
    });
  }

  async isCarAvailable(carId: string, startDate: string, endDate: string, excludeRentalId?: string): Promise<boolean> {
    const conflictingRentals = await this.getRentalsByDateRange(startDate, endDate);
    
    return !conflictingRentals.some(rental => 
      rental.carId === carId && 
      rental.status !== 'cancelled' && 
      rental.id !== excludeRentalId
    );
  }

  // Additional utility methods for KV-specific operations
  async deleteRental(rentalId: string): Promise<boolean> {
    const rental = await this.getRental(rentalId);
    if (!rental) return false;

    // Remove from all indexes
    await kv.del(this.RENTAL_PREFIX + rentalId);
    await kv.srem(this.RENTAL_LIST_KEY, rentalId);
    
    const customerRentalsKey = this.CUSTOMER_RENTALS_PREFIX + rental.customerId;
    await kv.srem(customerRentalsKey, rentalId);

    if (rental.payment.depositPaymentIntentId) {
      await kv.del(this.PAYMENT_INTENT_PREFIX + rental.payment.depositPaymentIntentId);
    }
    if (rental.payment.finalPaymentIntentId) {
      await kv.del(this.PAYMENT_INTENT_PREFIX + rental.payment.finalPaymentIntentId);
    }

    return true;
  }

  // Get database stats
  async getStats(): Promise<{
    totalRentals: number;
    rentalsByStatus: Record<string, number>;
  }> {
    const allRentals = await this.getAllRentals();
    
    const rentalsByStatus: Record<string, number> = {};
    allRentals.forEach(rental => {
      rentalsByStatus[rental.status] = (rentalsByStatus[rental.status] || 0) + 1;
    });

    return {
      totalRentals: allRentals.length,
      rentalsByStatus
    };
  }
}

// Create singleton instance
const kvRentalDB = new KVRentalDatabase();

export default kvRentalDB;