export interface AdditionalPayment {
  id: string;
  amount: number;
  description: string;
  paymentIntentId: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
  processedBy: string; // admin user who created the charge
}

export interface RentalHistory {
  id: string;
  action: 'created' | 'confirmed' | 'cancelled' | 'rescheduled' | 'payment_captured' | 'payment_charged' | 'additional_payment' | 'completed';
  description: string;
  performedBy: string; // user or admin who performed the action
  metadata?: Record<string, any>; // additional data like old dates, amounts, etc.
  createdAt: string;
}

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
  originalDates?: {
    startDate: string;
    endDate: string;
  }; // for tracking reschedules
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
    additionalPayments?: AdditionalPayment[];
    totalPaid: number; // running total of all payments
  };
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'rescheduled';
  history: RentalHistory[];
  cancelledAt?: string;
  cancelReason?: string;
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

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CustomInvoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerDetails: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentIntentId?: string;
  paymentStatus?: 'pending' | 'succeeded' | 'failed';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}