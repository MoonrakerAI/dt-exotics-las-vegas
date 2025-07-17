export interface RentalBooking {
  id: string;
  customerId: string;
  stripeCustomerId: string;
  carId: string;
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    dailyPrice: number;
  };
  rentalDates: {
    startDate: string;
    endDate: string;
  };
  pricing: {
    dailyRate: number;
    totalDays: number;
    subtotal: number;
    depositAmount: number;
    finalAmount: number;
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    driversLicense: string;
  };
  payment: {
    depositPaymentIntentId: string;
    depositStatus: 'pending' | 'authorized' | 'captured' | 'failed';
    finalPaymentIntentId?: string;
    finalPaymentStatus?: 'pending' | 'succeeded' | 'failed';
  };
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateRentalRequest {
  carId: string;
  startDate: string;
  endDate: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    driversLicense: string;
  };
}

export interface PaymentIntentData {
  amount: number;
  currency: string;
  paymentIntentId: string;
  clientSecret: string;
  customerId: string;
  rentalId: string;
}