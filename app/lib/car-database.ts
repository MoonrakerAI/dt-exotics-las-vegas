import { kv } from '@vercel/kv';
import { Car } from '../data/cars';
import kvRentalDB from './kv-database';

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
    return car;
  }

  // Get a car by ID
  async getCar(carId: string): Promise<Car | null> {
    const car = await kv.get<Car>(this.CAR_PREFIX + carId);
    return car || null;
  }

  // Update a car
  async updateCar(carId: string, updates: Partial<Car>): Promise<Car | null> {
    const existing = await this.getCar(carId);
    if (!existing) return null;
    const updatedCar: Car = { ...existing, ...updates };
    await kv.set(this.CAR_PREFIX + carId, updatedCar);
    return updatedCar;
  }

  // Delete a car
  async deleteCar(carId: string): Promise<boolean> {
    const car = await this.getCar(carId);
    if (!car) return false;
    await kv.del(this.CAR_PREFIX + carId);
    await kv.srem(this.CAR_LIST_KEY, carId);
    await kv.del(this.AVAILABILITY_PREFIX + carId);
    return true;
  }

  // List all cars
  async getAllCars(): Promise<Car[]> {
    const carIds = await kv.smembers(this.CAR_LIST_KEY);
    if (!carIds.length) return [];
    const cars: Car[] = [];
    for (const id of carIds) {
      const car = await this.getCar(id as string);
      if (car) cars.push(car);
    }
    return cars;
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