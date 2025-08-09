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
    additionalCharges?: number;
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
    stripeCustomerId: string;
    savedPaymentMethodId?: string;
    additionalCharges?: Array<{
      id: string;
      amount: number;
      memo: string;
      chargedAt: string;
      status: 'succeeded' | 'failed' | 'pending';
    }>;
  };
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  rescheduleHistory?: Array<{
    previousStartDate: string;
    previousEndDate: string;
    newStartDate: string;
    newEndDate: string;
    reason: string;
    rescheduledAt: string;
    rescheduledBy: string;
  }>;
  cancellation?: {
    cancelledAt: string;
    cancelledBy: string;
    reason: string;
    refundAmount: number;
    refundProcessed: boolean;
  };
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