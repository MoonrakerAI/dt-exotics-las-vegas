import { kv } from '@vercel/kv';
import { Car } from '../data/cars';
import kvRentalDB from './kv-database';
import aiKB from './ai-knowledge-base';

// Per-day availability: store as an array of ISO date strings (YYYY-MM-DD) when the car is unavailable
export interface CarAvailability {
  carId: string;
  unavailableDates: string[]; // e.g., ['2024-06-01', '2024-06-02']
}

class CarDatabase {
  private readonly CAR_PREFIX = 'car:';
  private readonly CAR_LIST_KEY = 'cars:all';
  private readonly AVAILABILITY_PREFIX = 'car:availability:';

  // Create a new car
  async createCar(car: Car): Promise<Car> {
    await kv.set(this.CAR_PREFIX + car.id, car);
    await kv.sadd(this.CAR_LIST_KEY, car.id);
    
    // Update AI knowledge base with new fleet information
    try {
      await aiKB.updateKnowledgeBase();
      console.log('AI Knowledge Base updated after adding car:', car.id);
    } catch (error) {
      console.error('Failed to update AI Knowledge Base after adding car:', error);
    }
    
    return car;
  }

  // Get a car by ID
  async getCar(carId: string): Promise<Car | null> {
    const car = await kv.get<Car>(this.CAR_PREFIX + carId);
    return car || null;
  }

  // Update a car
  async updateCar(carId: string, updates: Partial<Car>): Promise<Car | null> {
    const reqId = (globalThis as any).crypto?.randomUUID?.() || `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[updateCar][${reqId}] Starting update for ${carId}`, { updates });
    
    let existing = await this.getCar(carId);
    
    // If car not found via direct lookup, try to find it in the full list
    // This handles KV storage inconsistencies where the car exists in the list but not as individual key
    if (!existing) {
      console.warn(`[updateCar][${reqId}] Direct lookup failed for ${carId}, checking full list...`);
      const allCars = await this.getAllCars();
      existing = allCars.find(car => car.id === carId) || null;
      
      if (!existing) {
        console.error(`[updateCar][${reqId}] Car ${carId} not found in full list either`);
        return null;
      }
      
      console.log(`[updateCar][${reqId}] Found ${carId} in full list, will recreate KV entry`);
    } else {
      console.log(`[updateCar][${reqId}] Found ${carId} via direct lookup`);
    }
    
    const updatedCar: Car = { ...existing, ...updates };
    console.log(`[updateCar][${reqId}] Merged car data:`, { 
      id: updatedCar.id, 
      brand: updatedCar.brand, 
      model: updatedCar.model,
      available: updatedCar.available,
      showOnHomepage: updatedCar.showOnHomepage 
    });
    
    // Store the updated car data
    try {
      await kv.set(this.CAR_PREFIX + carId, updatedCar);
      console.log(`[updateCar][${reqId}] Successfully stored updated car data`);
      
      // Verify the storage
      const verification = await kv.get(this.CAR_PREFIX + carId);
      if (verification) {
        console.log(`[updateCar][${reqId}] Verification successful - car data stored correctly`);
      } else {
        console.error(`[updateCar][${reqId}] Verification failed - car data not found after storage`);
      }
    } catch (error) {
      console.error(`[updateCar][${reqId}] Failed to store car data:`, error);
      throw error;
    }
    
    // Update AI knowledge base with updated fleet information
    try {
      await aiKB.updateKnowledgeBase();
      console.log(`[updateCar][${reqId}] AI Knowledge Base updated after updating car:`, carId);
    } catch (error) {
      console.error(`[updateCar][${reqId}] Failed to update AI Knowledge Base after updating car:`, error);
    }
    
    console.log(`[updateCar][${reqId}] Update completed successfully for ${carId}`);
    return updatedCar;
  }

  // Update display order for multiple cars
  async updateCarDisplayOrders(carOrders: { carId: string; displayOrder: number }[]): Promise<void> {
    const updatePromises = carOrders.map(async ({ carId, displayOrder }) => {
      const car = await this.getCar(carId);
      if (car) {
        await this.updateCar(carId, { displayOrder });
      }
    });
    
    await Promise.all(updatePromises);
  }

  // Delete a car
  async deleteCar(carId: string): Promise<boolean> {
    const car = await this.getCar(carId);
    if (!car) return false;
    await kv.del(this.CAR_PREFIX + carId);
    await kv.srem(this.CAR_LIST_KEY, carId);
    await kv.del(this.AVAILABILITY_PREFIX + carId);
    
    // Update AI knowledge base after removing car from fleet
    try {
      await aiKB.updateKnowledgeBase();
      console.log('AI Knowledge Base updated after deleting car:', carId);
    } catch (error) {
      console.error('Failed to update AI Knowledge Base after deleting car:', error);
    }
    
    return true;
  }

  // List all cars
  async getAllCars(): Promise<Car[]> {
    try {
      const reqId = (globalThis as any).crypto?.randomUUID?.() || `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      console.log(`[carDB.getAllCars][${reqId}] fetching ids...`);
      const carIds = await kv.smembers(this.CAR_LIST_KEY);
      console.log(`[carDB.getAllCars][${reqId}] idCount=${carIds.length}`);
      
      if (!carIds.length) {
        console.log(`[carDB.getAllCars][${reqId}] no ids`);
        return [];
      }
      
      // Fetch all cars in parallel to avoid per-item latency and function timeouts
      const results = await Promise.allSettled(
        carIds.map((id) => this.getCar(id as string))
      );
      const cars: Car[] = [];
      let failures = 0;
      results.forEach((res, idx) => {
        const id = carIds[idx];
        if (res.status === 'fulfilled') {
          const car = res.value;
          if (car) {
            cars.push(car);
          } else {
            console.warn(`[carDB.getAllCars][${reqId}] missing car`, { id });
          }
        } else {
          failures += 1;
          console.error(`[carDB.getAllCars][${reqId}] fetch error for id`, { id, error: res.reason });
        }
      });
      console.log(`[carDB.getAllCars][${reqId}] fetched=${cars.length} failures=${failures}`);
      
      // Sort by displayOrder if available, otherwise by price (most expensive first)
      return cars.sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        if (a.displayOrder !== undefined) return -1;
        if (b.displayOrder !== undefined) return 1;
        return b.price.daily - a.price.daily;
      });
    } catch (error) {
      console.error('Error in getAllCars:', error);
      return [];
    }
  }

  // Set per-day availability (unavailable dates)
  async setCarAvailability(carId: string, unavailableDates: string[]): Promise<void> {
    await kv.set(this.AVAILABILITY_PREFIX + carId, unavailableDates);
  }

  // Get per-day availability (unavailable dates)
  async getCarAvailability(carId: string): Promise<string[]> {
    const dates = await kv.get<string[]>(this.AVAILABILITY_PREFIX + carId);
    return dates || [];
  }

  // Toggle homepage visibility
  async setShowOnHomepage(carId: string, show: boolean): Promise<Car | null> {
    return this.updateCar(carId, { showOnHomepage: show });
  }

  // Check if car is available for rental (considering both custom blocks and bookings)
  async isCarAvailableForRental(carId: string, startDate: string, endDate: string): Promise<{
    available: boolean;
    conflicts: {
      customBlocks: string[];
      bookingConflicts: boolean;
    };
  }> {
    // Check if car exists and is generally available
    const car = await this.getCar(carId);
    if (!car || !car.available) {
      return {
        available: false,
        conflicts: { customBlocks: [], bookingConflicts: false }
      };
    }

    // Get custom unavailable dates
    const customUnavailableDates = await this.getCarAvailability(carId);
    
    // Generate all dates in the requested range
    const requestedDates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      requestedDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Check for custom blocks
    const customBlocks = requestedDates.filter(date => 
      customUnavailableDates.includes(date)
    );
    
    // Check for booking conflicts
    const bookingConflicts = await kvRentalDB.isCarAvailable(carId, startDate, endDate);
    
    return {
      available: customBlocks.length === 0 && bookingConflicts,
      conflicts: {
        customBlocks,
        bookingConflicts: !bookingConflicts
      }
    };
  }

  // OPTIMIZED: Get batch availability for a date range (for calendar performance)
  async getCarAvailabilityBatch(carId: string, startDate: string, endDate: string): Promise<{
    [date: string]: { available: boolean; reason?: string; price?: number }
  }> {
    // Parallel database calls for maximum efficiency
    const [car, customUnavailableDates, conflictingRentals] = await Promise.all([
      this.getCar(carId),
      this.getCarAvailability(carId),
      kvRentalDB.getRentalsByDateRange(startDate, endDate)
    ]);

    if (!car || !car.available) {
      // Return all dates as unavailable if car doesn't exist or is disabled
      const result: { [date: string]: { available: boolean; reason?: string; price?: number } } = {};
      const current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        result[dateStr] = {
          available: false,
          reason: 'Car unavailable'
        };
        current.setDate(current.getDate() + 1);
      }
      return result;
    }

    // Filter rentals for this specific car (excluding cancelled)
    const carRentals = conflictingRentals.filter(rental => 
      rental.carId === carId && rental.status !== 'cancelled'
    );

    // Process all dates in memory (no additional DB calls)
    const availability: { [date: string]: { available: boolean; reason?: string; price?: number } } = {};
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const currentDateObj = new Date(dateStr);
      
      // Check if date is in custom blocks
      const isCustomBlocked = customUnavailableDates.includes(dateStr);
      
      // Check if date conflicts with any rental (in memory check)
      const hasBookingConflict = carRentals.some(rental => {
        const rentalStart = new Date(rental.rentalDates.startDate);
        const rentalEnd = new Date(rental.rentalDates.endDate);
        return currentDateObj >= rentalStart && currentDateObj <= rentalEnd;
      });
      
      const isAvailable = !isCustomBlocked && !hasBookingConflict;
      
      availability[dateStr] = {
        available: isAvailable,
        reason: !isAvailable ? (
          hasBookingConflict ? 'Already booked' :
          isCustomBlocked ? 'Not available' :
          'Car unavailable'
        ) : undefined,
        price: car.price.daily
      };
      
      current.setDate(current.getDate() + 1);
    }
    
    return availability;
  }

  // Get cars available for specific dates (for frontend use)
  async getAvailableCarsForDates(startDate: string, endDate: string, showOnHomepage = true): Promise<Car[]> {
    const allCars = await this.getAllCars();
    const availableCars = [];
    
    for (const car of allCars) {
      if (showOnHomepage && !car.showOnHomepage) continue;
      
      const availability = await this.isCarAvailableForRental(car.id, startDate, endDate);
      if (availability.available) {
        availableCars.push(car);
      }
    }
    
    return availableCars;
  }
}

const carDB = new CarDatabase();
export default carDB; 