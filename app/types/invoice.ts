export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface InvoiceCustomer {
  name: string
  email: string
  phone?: string
  address?: {
    line1: string
    line2?: string
    city: string
    state: string
    zipCode: string
  }
}

export interface Invoice {
  id: string
  invoiceNumber: string
  status: 'draft' | 'ready' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  
  // Customer information
  customer: InvoiceCustomer
  
  // Invoice details
  title: string
  description?: string
  serviceType: 'vip' | 'bachelor_party' | 'corporate' | 'custom' | 'other'
  
  // Line items
  lineItems: InvoiceLineItem[]
  
  // Pricing
  subtotal: number
  taxRate: number
  taxAmount: number
  discountAmount?: number
  totalAmount: number
  
  // Payment
  depositRequired: boolean
  depositAmount?: number
  paymentMethod?: 'card' | 'bank_transfer' | 'cash'
  
  // Dates
  issueDate: string
  dueDate: string
  paidDate?: string
  
  // Notes and terms
  notes?: string
  terms?: string
  
  // System fields
  createdAt: string
  updatedAt: string
  createdBy: string
  
  // Payment integration
  stripePaymentIntentId?: string
  stripeCustomerId?: string
  paymentLinkId?: string
  
  // Related bookings (if applicable)
  relatedRentalId?: string
}

export interface InvoicePreview {
  invoice: Invoice
  previewUrl: string
  paymentUrl?: string
}

export interface CreateInvoiceRequest {
  customer: InvoiceCustomer
  title: string
  description?: string
  serviceType: Invoice['serviceType']
  lineItems: Omit<InvoiceLineItem, 'id' | 'amount'>[]
  taxRate: number
  discountAmount?: number
  depositRequired: boolean
  depositAmount?: number
  dueDate: string
  notes?: string
  terms?: string
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {
  status?: Invoice['status']
}

export interface InvoiceFilters {
  status?: Invoice['status']
  serviceType?: Invoice['serviceType']
  dateFrom?: string
  dateTo?: string
  customerId?: string
  search?: string
}

export interface InvoiceStats {
  totalInvoices: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  statusBreakdown: Record<Invoice['status'], number>
}