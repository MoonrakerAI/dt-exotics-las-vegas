// Input validation and sanitization utilities

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedValue?: any;
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }

  return { 
    valid: true, 
    sanitizedValue: email.toLowerCase().trim() 
  };
}

// Phone number validation (US format)
export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length !== 10) {
    return { valid: false, error: 'Phone number must be 10 digits' };
  }

  return { 
    valid: true, 
    sanitizedValue: `(${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3,6)}-${digitsOnly.slice(6)}` 
  };
}

// Name validation
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: `${fieldName} is too long` };
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { 
    valid: true, 
    sanitizedValue: trimmed 
  };
}

// Driver's license validation
export function validateDriversLicense(license: string): ValidationResult {
  if (!license || typeof license !== 'string') {
    return { valid: false, error: 'Driver\'s license is required' };
  }

  const trimmed = license.trim();
  
  if (trimmed.length < 5) {
    return { valid: false, error: 'Driver\'s license is too short' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Driver\'s license is too long' };
  }

  // Allow alphanumeric characters and common separators
  const licenseRegex = /^[A-Z0-9\s\-\.]+$/i;
  if (!licenseRegex.test(trimmed)) {
    return { valid: false, error: 'Driver\'s license contains invalid characters' };
  }

  return { 
    valid: true, 
    sanitizedValue: trimmed.toUpperCase() 
  };
}

// Date validation
export function validateDate(date: string, fieldName: string = 'Date'): ValidationResult {
  if (!date || typeof date !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: `Invalid ${fieldName.toLowerCase()} format` };
  }

  return { 
    valid: true, 
    sanitizedValue: parsedDate.toISOString().split('T')[0] 
  };
}

// Amount validation
export function validateAmount(amount: number, fieldName: string = 'Amount'): ValidationResult {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (amount < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  if (amount > 1000000) {
    return { valid: false, error: `${fieldName} is too large` };
  }

  return { 
    valid: true, 
    sanitizedValue: Math.round(amount * 100) / 100 // Round to 2 decimal places
  };
}

// Message/content validation
export function validateMessage(message: string, maxLength: number = 1000): ValidationResult {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Message is too long (max ${maxLength} characters)` };
  }

  // Basic XSS protection - remove script tags
  const sanitized = trimmed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return { 
    valid: true, 
    sanitizedValue: sanitized 
  };
}

// Car ID validation
export function validateCarId(carId: string): ValidationResult {
  if (!carId || typeof carId !== 'string') {
    return { valid: false, error: 'Car selection is required' };
  }

  const trimmed = carId.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Car selection is required' };
  }

  // Allow alphanumeric characters, hyphens, and underscores
  const carIdRegex = /^[a-zA-Z0-9\-_]+$/;
  if (!carIdRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid car ID format' };
  }

  return { 
    valid: true, 
    sanitizedValue: trimmed 
  };
}

// Rental request validation
export interface RentalRequest {
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

export function validateRentalRequest(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request data' };
  }

  // Validate car ID
  const carIdValidation = validateCarId(data.carId);
  if (!carIdValidation.valid) {
    return carIdValidation;
  }

  // Validate dates
  const startDateValidation = validateDate(data.startDate, 'Start date');
  if (!startDateValidation.valid) {
    return startDateValidation;
  }

  const endDateValidation = validateDate(data.endDate, 'End date');
  if (!endDateValidation.valid) {
    return endDateValidation;
  }

  // Validate customer data
  if (!data.customer || typeof data.customer !== 'object') {
    return { valid: false, error: 'Customer information is required' };
  }

  const firstNameValidation = validateName(data.customer.firstName, 'First name');
  if (!firstNameValidation.valid) {
    return firstNameValidation;
  }

  const lastNameValidation = validateName(data.customer.lastName, 'Last name');
  if (!lastNameValidation.valid) {
    return lastNameValidation;
  }

  const emailValidation = validateEmail(data.customer.email);
  if (!emailValidation.valid) {
    return emailValidation;
  }

  const phoneValidation = validatePhone(data.customer.phone);
  if (!phoneValidation.valid) {
    return phoneValidation;
  }

  const licenseValidation = validateDriversLicense(data.customer.driversLicense);
  if (!licenseValidation.valid) {
    return licenseValidation;
  }

  // Validate date range
  const startDate = new Date(startDateValidation.sanitizedValue);
  const endDate = new Date(endDateValidation.sanitizedValue);
  const now = new Date();

  if (startDate <= now) {
    return { valid: false, error: 'Start date must be in the future' };
  }

  if (endDate <= startDate) {
    return { valid: false, error: 'End date must be after start date' };
  }

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 1) {
    return { valid: false, error: 'Minimum rental period is 1 day' };
  }

  if (daysDiff > 30) {
    return { valid: false, error: 'Maximum rental period is 30 days' };
  }

  return {
    valid: true,
    sanitizedValue: {
      carId: carIdValidation.sanitizedValue,
      startDate: startDateValidation.sanitizedValue,
      endDate: endDateValidation.sanitizedValue,
      customer: {
        firstName: firstNameValidation.sanitizedValue,
        lastName: lastNameValidation.sanitizedValue,
        email: emailValidation.sanitizedValue,
        phone: phoneValidation.sanitizedValue,
        driversLicense: licenseValidation.sanitizedValue
      }
    }
  };
} 