import { NextRequest, NextResponse } from 'next/server'
import NotificationService from '@/app/lib/notifications'

// Event type labels for better email formatting
const EVENT_TYPE_LABELS: { [key: string]: string } = {
  'bachelor-party': 'Bachelor Party',
  'birthday': 'Birthday Celebration',
  'corporate': 'Corporate Event',
  'vip-services': 'VIP Services',
  'partners': 'Partnership Inquiry'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, formData, timestamp } = body

    if (!eventType || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phone']
    for (const field of requiredFields) {
      if (!formData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create event inquiry data for notification
    const eventInquiry = {
      eventType: EVENT_TYPE_LABELS[eventType] || eventType,
      customerName: formData.fullName,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      formData,
      submittedAt: timestamp || new Date().toISOString()
    }

    // Send admin notification email
    const notificationSent = await NotificationService.sendEventInquiry(eventInquiry)

    if (notificationSent) {
      return NextResponse.json({
        success: true,
        message: 'Event inquiry submitted successfully'
      })
    } else {
      // Still return success to user even if notification fails
      console.error('Failed to send admin notification for event inquiry')
      return NextResponse.json({
        success: true,
        message: 'Event inquiry submitted successfully'
      })
    }
  } catch (error) {
    console.error('Event contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry. Please try again.' },
      { status: 500 }
    )
  }
}
