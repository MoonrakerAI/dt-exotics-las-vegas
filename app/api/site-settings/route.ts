import { NextResponse } from 'next/server'
import { getSiteSettings } from '../../lib/site-settings'

/**
 * Public API endpoint to get site settings
 * No authentication required as this is public information
 */
export async function GET() {
  try {
    const settings = await getSiteSettings()
    
    return NextResponse.json({ 
      success: true,
      settings 
    })
  } catch (error) {
    console.error('Error fetching site settings:', error)
    
    // Return default settings if there's an error
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch settings',
      settings: {
        siteName: 'DT Exotics Las Vegas',
        siteDescription: 'Luxury Exotic Car Rentals in Las Vegas',
        contactEmail: 'info@dtexoticslv.com',
        supportEmail: 'support@dtexoticslv.com',
        phoneNumber: '+1 (702) 123-4567'
      }
    })
  }
}
