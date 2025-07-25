export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  avatar?: string;
  role: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSettings {
  profiles: Record<string, AdminProfile>;
  systemSettings: {
    siteName: string;
    companyInfo: {
      name: string;
      address: string;
      phone: string;
      email: string;
      taxId?: string;
    };
    invoiceSettings: {
      nextInvoiceNumber: number;
      defaultTaxRate: number;
      defaultDueDays: number;
      invoicePrefix: string;
    };
  };
}

export interface BookingFilter {
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  carId?: string;
  customerId?: string;
  searchQuery?: string;
  sortBy?: 'createdAt' | 'startDate' | 'customerName' | 'carModel' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}