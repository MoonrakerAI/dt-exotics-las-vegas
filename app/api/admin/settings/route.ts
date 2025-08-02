import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { validateSession } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      const user = await validateSession(token)
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get general settings from KV store
    const settings = await kv.hget('site:settings', 'general') || {
      siteName: 'DT Exotics Las Vegas',
      siteDescription: 'Luxury Exotic Car Rentals in Las Vegas',
      contactEmail: 'info@dtexoticslv.com',
      supportEmail: 'support@dtexoticslv.com',
      phoneNumber: '+1 (702) 123-4567'
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching general settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      const user = await validateSession(token)
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get settings from request body
    const { settings } = await request.json()
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings data required' }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = ['siteName', 'siteDescription', 'contactEmail', 'supportEmail', 'phoneNumber']
    for (const field of requiredFields) {
      if (!settings[field] || typeof settings[field] !== 'string' || settings[field].trim() === '') {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(settings.contactEmail)) {
      return NextResponse.json({ error: 'Invalid contact email format' }, { status: 400 })
    }
    if (!emailRegex.test(settings.supportEmail)) {
      return NextResponse.json({ error: 'Invalid support email format' }, { status: 400 })
    }

    // Save general settings to KV store
    await kv.hset('site:settings', { general: settings })

    console.log('General settings updated:', settings)

    return NextResponse.json({ 
      success: true, 
      message: 'General settings updated successfully',
      settings 
    })
  } catch (error) {
    console.error('Error updating general settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
