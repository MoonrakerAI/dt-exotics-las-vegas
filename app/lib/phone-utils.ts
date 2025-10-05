/**
 * Phone number validation and formatting utilities
 * Prevents phishing vectors by validating phone numbers against known business contacts
 */

// Verified business phone numbers
const VERIFIED_PHONE_NUMBERS = [
  '+17025180924', // Primary business number
]

/**
 * Validates if a phone number is a verified business contact
 */
export function isVerifiedPhoneNumber(phoneNumber: string): boolean {
  const normalized = phoneNumber.replace(/\D/g, '')
  // Handle both 10-digit and 11-digit formats (with or without country code)
  const normalizedWithCountry = normalized.length === 10 ? `1${normalized}` : normalized
  return VERIFIED_PHONE_NUMBERS.some(verified => {
    const verifiedNormalized = verified.replace(/\D/g, '')
    return verifiedNormalized === normalizedWithCountry || verifiedNormalized === normalized
  })
}

/**
 * Formats phone number for links (tel: or sms:)
 * Only returns the link if the number is verified
 */
export function getVerifiedPhoneLink(phoneNumber: string, type: 'tel' | 'sms' = 'tel'): string | null {
  if (!isVerifiedPhoneNumber(phoneNumber)) {
    console.warn(`Attempted to create ${type} link with unverified number: ${phoneNumber}`)
    return null
  }
  
  const normalized = phoneNumber.replace(/\D/g, '')
  return `${type}:+${normalized}`
}

/**
 * Formats phone number for display
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  const normalized = phoneNumber.replace(/\D/g, '')
  
  if (normalized.length === 11 && normalized.startsWith('1')) {
    const areaCode = normalized.slice(1, 4)
    const prefix = normalized.slice(4, 7)
    const line = normalized.slice(7)
    return `(${areaCode}) ${prefix}-${line}`
  }
  
  if (normalized.length === 10) {
    const areaCode = normalized.slice(0, 3)
    const prefix = normalized.slice(3, 6)
    const line = normalized.slice(6)
    return `(${areaCode}) ${prefix}-${line}`
  }
  
  return phoneNumber
}

/**
 * Safe phone link component props
 */
export interface SafePhoneLinkProps {
  phoneNumber: string
  type?: 'tel' | 'sms'
  className?: string
  children?: React.ReactNode
}
