import { kv } from '@vercel/kv'

export interface SiteSettings {
  siteName: string
  siteDescription: string
  contactEmail: string
  supportEmail: string
  phoneNumber: string
}

// Default settings fallback
const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'DT Exotics Las Vegas',
  siteDescription: 'Luxury Exotic Car Rentals in Las Vegas',
  contactEmail: 'info@dtexoticslv.com',
  supportEmail: 'support@dtexoticslv.com',
  phoneNumber: '+1 (702) 518-0924' // Verified business number
}

// Cache for settings to avoid repeated database calls
let settingsCache: SiteSettings | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get site settings from database with caching
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const now = Date.now()
  
  // Return cached settings if still valid
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache
  }
  
  try {
    // Fetch from database
    const settings = await kv.hget('site:settings', 'general') as SiteSettings | null
    
    if (settings && isValidSettings(settings)) {
      settingsCache = settings
      cacheTimestamp = now
      return settings
    }
  } catch (error) {
    console.error('Error fetching site settings:', error)
  }
  
  // Return default settings if database fetch fails or settings are invalid
  settingsCache = DEFAULT_SETTINGS
  cacheTimestamp = now
  return DEFAULT_SETTINGS
}

/**
 * Clear settings cache (useful when settings are updated)
 */
export function clearSettingsCache(): void {
  settingsCache = null
  cacheTimestamp = 0
}

/**
 * Validate settings object has all required fields
 */
function isValidSettings(settings: any): settings is SiteSettings {
  return (
    settings &&
    typeof settings === 'object' &&
    typeof settings.siteName === 'string' &&
    typeof settings.siteDescription === 'string' &&
    typeof settings.contactEmail === 'string' &&
    typeof settings.supportEmail === 'string' &&
    typeof settings.phoneNumber === 'string' &&
    settings.siteName.trim() !== '' &&
    settings.siteDescription.trim() !== '' &&
    settings.contactEmail.trim() !== '' &&
    settings.supportEmail.trim() !== '' &&
    settings.phoneNumber.trim() !== ''
  )
}

/**
 * Format phone number for display (removes +1 and formats as (XXX) XXX-XXXX)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '')
  
  // Handle US numbers (remove leading 1 if present)
  const cleanDigits = digits.startsWith('1') ? digits.slice(1) : digits
  
  // Format as (XXX) XXX-XXXX
  if (cleanDigits.length === 10) {
    return `(${cleanDigits.slice(0, 3)}) ${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6)}`
  }
  
  // Return original if not a standard US number
  return phoneNumber
}

/**
 * Format phone number for SMS/tel links (keeps +1 format)
 */
export function formatPhoneForLink(phoneNumber: string): string {
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '')
  
  // Add +1 if not present and it's a 10-digit US number
  if (digits.length === 10) {
    return `+1${digits}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  // Return original if not a standard format
  return phoneNumber
}

/**
 * Generate page title with site name suffix
 */
export function generatePageTitle(pageTitle: string, siteName?: string): string {
  const siteNameToUse = siteName || DEFAULT_SETTINGS.siteName
  return `${pageTitle} | ${siteNameToUse}`
}
