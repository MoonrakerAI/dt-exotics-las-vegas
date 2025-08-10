export interface RentalAgreement {
  id: string;
  bookingId: string;
  status: 'pending' | 'completed' | 'expired';
  
  // Agreement content
  agreementData: {
    // Personal Information
    fullName: string;
    dateOfBirth: string;
    driversLicenseNumber: string;
    driversLicenseState: string;
    driversLicenseExpiry: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
    
    // Rental Details (pre-filled from booking)
    vehicleInfo: {
      brand: string;
      model: string;
      year: number;
      licensePlate?: string;
      vin?: string;
    };
    rentalPeriod: {
      startDate: string;
      endDate: string;
      pickupTime: string;
      returnTime: string;
    };
    pricing: {
      dailyRate: number;
      totalDays: number;
      subtotal: number;
      securityDeposit: number;
      totalAmount: number;
    };
    
    // Agreement Terms Acknowledgment
    termsAccepted: {
      ageRequirement: boolean; // 25+ years old
      validLicense: boolean; // Valid driver's license
      insurance: boolean; // Adequate insurance coverage
      noViolations: boolean; // No major violations in past 3 years
      vehicleCondition: boolean; // Accept vehicle in current condition
      returnCondition: boolean; // Return in same condition
      fuelPolicy: boolean; // Return with same fuel level
      smokingPolicy: boolean; // No smoking in vehicle
      geographicLimits: boolean; // Stay within approved areas
      modifications: boolean; // No modifications to vehicle
      liability: boolean; // Accept liability for damages
      lateReturn: boolean; // Understand late return fees
    };
    
    // Digital Signature
    signature: {
      dataUrl: string; // Base64 signature image
      timestamp: string;
      ipAddress: string;
    };
    
    // Additional Notes
    specialInstructions?: string;
    adminNotes?: string;
  };
  
  // Metadata
  sentAt: string;
  completedAt?: string;
  expiresAt: string; // 7 days from sent
  sentBy: string; // Admin who sent it
  clientIpAddress?: string;
  
  // Email tracking
  emailSent: boolean;
  emailOpenedAt?: string;
  remindersSent: number;
  lastReminderAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateRentalAgreementRequest {
  bookingId: string;
  expirationDays?: number; // Default 7 days
  customMessage?: string;
  // Optional list of recipient emails. If omitted, defaults to booking.customer.email
  recipientEmails?: string[];
}

export interface RentalAgreementFormData {
  // Personal Information
  fullName: string;
  dateOfBirth: string;
  driversLicenseNumber: string;
  driversLicenseState: string;
  driversLicenseExpiry: string;
  
  // Address
  street: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  
  // Rental Times
  pickupTime: string;
  returnTime: string;
  
  // Terms Acceptance
  ageRequirement: boolean;
  validLicense: boolean;
  insurance: boolean;
  noViolations: boolean;
  vehicleCondition: boolean;
  returnCondition: boolean;
  fuelPolicy: boolean;
  smokingPolicy: boolean;
  geographicLimits: boolean;
  modifications: boolean;
  liability: boolean;
  lateReturn: boolean;
  
  // Signature
  signature: string; // Base64 data URL
  
  // Optional
  specialInstructions?: string;
}
