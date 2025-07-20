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

// Blog post validation
export interface BlogPostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  featuredImage?: string;
  categories: string[];
  tags: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogTitle: string;
    ogDescription: string;
    ogImage?: string;
    canonicalUrl?: string;
    noIndex: boolean;
    noFollow: boolean;
  };
}

export function validateBlogPost(data: any): ValidationResult {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid blog post data' };
  }

  // Validate title
  if (!data.title || typeof data.title !== 'string') {
    return { valid: false, error: 'Title is required' };
  }

  const title = data.title.trim();
  if (title.length < 5) {
    return { valid: false, error: 'Title must be at least 5 characters' };
  }

  if (title.length > 200) {
    return { valid: false, error: 'Title is too long (max 200 characters)' };
  }

  // Validate slug
  if (!data.slug || typeof data.slug !== 'string') {
    return { valid: false, error: 'Slug is required' };
  }

  const slug = data.slug.trim().toLowerCase();
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }

  if (slug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters' };
  }

  if (slug.length > 100) {
    return { valid: false, error: 'Slug is too long (max 100 characters)' };
  }

  // Validate excerpt
  if (!data.excerpt || typeof data.excerpt !== 'string') {
    return { valid: false, error: 'Excerpt is required' };
  }

  const excerpt = data.excerpt.trim();
  if (excerpt.length < 10) {
    return { valid: false, error: 'Excerpt must be at least 10 characters' };
  }

  if (excerpt.length > 500) {
    return { valid: false, error: 'Excerpt is too long (max 500 characters)' };
  }

  // Validate content
  if (!data.content || typeof data.content !== 'string') {
    return { valid: false, error: 'Content is required' };
  }

  const content = data.content.trim();
  if (content.length < 50) {
    return { valid: false, error: 'Content must be at least 50 characters' };
  }

  if (content.length > 50000) {
    return { valid: false, error: 'Content is too long (max 50,000 characters)' };
  }

  // Validate status
  if (!['draft', 'published', 'archived'].includes(data.status)) {
    return { valid: false, error: 'Invalid status. Must be draft, published, or archived' };
  }

  // Validate featured flag
  if (typeof data.featured !== 'boolean') {
    return { valid: false, error: 'Featured must be a boolean value' };
  }

  // Validate categories
  if (!Array.isArray(data.categories)) {
    return { valid: false, error: 'Categories must be an array' };
  }

  if (data.categories.length === 0) {
    return { valid: false, error: 'At least one category is required' };
  }

  if (data.categories.length > 10) {
    return { valid: false, error: 'Too many categories (max 10)' };
  }

  for (const category of data.categories) {
    if (typeof category !== 'string' || category.trim().length === 0) {
      return { valid: false, error: 'Invalid category format' };
    }
  }

  // Validate tags
  if (!Array.isArray(data.tags)) {
    return { valid: false, error: 'Tags must be an array' };
  }

  if (data.tags.length > 20) {
    return { valid: false, error: 'Too many tags (max 20)' };
  }

  for (const tag of data.tags) {
    if (typeof tag !== 'string' || tag.trim().length === 0) {
      return { valid: false, error: 'Invalid tag format' };
    }
  }

  // Validate SEO data
  if (!data.seo || typeof data.seo !== 'object') {
    return { valid: false, error: 'SEO data is required' };
  }

  const seo = data.seo;

  // Validate meta title
  if (!seo.metaTitle || typeof seo.metaTitle !== 'string') {
    return { valid: false, error: 'SEO meta title is required' };
  }

  if (seo.metaTitle.length > 60) {
    return { valid: false, error: 'SEO meta title is too long (max 60 characters)' };
  }

  // Validate meta description
  if (!seo.metaDescription || typeof seo.metaDescription !== 'string') {
    return { valid: false, error: 'SEO meta description is required' };
  }

  if (seo.metaDescription.length > 160) {
    return { valid: false, error: 'SEO meta description is too long (max 160 characters)' };
  }

  // Validate keywords
  if (!Array.isArray(seo.keywords)) {
    return { valid: false, error: 'SEO keywords must be an array' };
  }

  if (seo.keywords.length > 20) {
    return { valid: false, error: 'Too many SEO keywords (max 20)' };
  }

  for (const keyword of seo.keywords) {
    if (typeof keyword !== 'string' || keyword.trim().length === 0) {
      return { valid: false, error: 'Invalid SEO keyword format' };
    }
  }

  // Validate OG title
  if (!seo.ogTitle || typeof seo.ogTitle !== 'string') {
    return { valid: false, error: 'Open Graph title is required' };
  }

  if (seo.ogTitle.length > 95) {
    return { valid: false, error: 'Open Graph title is too long (max 95 characters)' };
  }

  // Validate OG description
  if (!seo.ogDescription || typeof seo.ogDescription !== 'string') {
    return { valid: false, error: 'Open Graph description is required' };
  }

  if (seo.ogDescription.length > 200) {
    return { valid: false, error: 'Open Graph description is too long (max 200 characters)' };
  }

  // Validate boolean flags
  if (typeof seo.noIndex !== 'boolean') {
    return { valid: false, error: 'SEO noIndex must be a boolean value' };
  }

  if (typeof seo.noFollow !== 'boolean') {
    return { valid: false, error: 'SEO noFollow must be a boolean value' };
  }

  // Sanitize and return
  return {
    valid: true,
    sanitizedValue: {
      title: title,
      slug: slug,
      excerpt: excerpt,
      content: content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''), // XSS protection
      status: data.status,
      featured: data.featured,
      featuredImage: data.featuredImage || undefined,
      categories: data.categories.map((cat: string) => cat.trim()),
      tags: data.tags.map((tag: string) => tag.trim()),
      seo: {
        metaTitle: seo.metaTitle.trim(),
        metaDescription: seo.metaDescription.trim(),
        keywords: seo.keywords.map((kw: string) => kw.trim()),
        ogTitle: seo.ogTitle.trim(),
        ogDescription: seo.ogDescription.trim(),
        ogImage: seo.ogImage || undefined,
        canonicalUrl: seo.canonicalUrl || undefined,
        noIndex: seo.noIndex,
        noFollow: seo.noFollow
      }
    }
  };
} 