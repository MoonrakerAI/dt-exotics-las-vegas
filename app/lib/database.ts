// Simple in-memory database for rental management
// In production, this would be replaced with a proper database like PostgreSQL or MongoDB

import { RentalBooking } from '../types/rental';

class RentalDatabase {
  private rentals: Map<string, RentalBooking> = new Map();
  private customerRentals: Map<string, string[]> = new Map();

  async createRental(rental: RentalBooking): Promise<RentalBooking> {
    this.rentals.set(rental.id, rental);
    
    // Track customer rentals
    const customerRentals = this.customerRentals.get(rental.customerId) || [];
    customerRentals.push(rental.id);
    this.customerRentals.set(rental.customerId, customerRentals);
    
    return rental;
  }

  async getRental(rentalId: string): Promise<RentalBooking | null> {
    return this.rentals.get(rentalId) || null;
  }

  async updateRental(rentalId: string, updates: Partial<RentalBooking>): Promise<RentalBooking | null> {
    const rental = this.rentals.get(rentalId);
    if (!rental) return null;

    const updatedRental = {
      ...rental,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.rentals.set(rentalId, updatedRental);
    return updatedRental;
  }

  async getRentalsByCustomer(customerId: string): Promise<RentalBooking[]> {
    const rentalIds = this.customerRentals.get(customerId) || [];
    return rentalIds.map(id => this.rentals.get(id)).filter(Boolean) as RentalBooking[];
  }

  async getRentalByPaymentIntent(paymentIntentId: string): Promise<RentalBooking | null> {
    for (const rental of this.rentals.values()) {
      if (rental.payment.depositPaymentIntentId === paymentIntentId || 
          rental.payment.finalPaymentIntentId === paymentIntentId) {
        return rental;
      }
    }
    return null;
  }

  async getAllRentals(): Promise<RentalBooking[]> {
    return Array.from(this.rentals.values());
  }

  async getRentalsByStatus(status: RentalBooking['status']): Promise<RentalBooking[]> {
    return Array.from(this.rentals.values()).filter(rental => rental.status === status);
  }

  async getRentalsByDateRange(startDate: string, endDate: string): Promise<RentalBooking[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return Array.from(this.rentals.values()).filter(rental => {
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
}

// Create singleton instance
const rentalDB = new RentalDatabase();

export default rentalDB;