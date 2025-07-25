import { NextRequest, NextResponse } from 'next/server'
import kvRentalDB from '@/app/lib/kv-database'
import { verifyJWT } from '@/app/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const carId = searchParams.get('carId')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let bookings = await kvRentalDB.getAllRentals()

    // Apply filters
    if (status) {
      bookings = bookings.filter(booking => booking.status === status)
    }

    if (carId) {
      bookings = bookings.filter(booking => booking.carId === carId)
    }

    if (customerId) {
      bookings = bookings.filter(booking => booking.customerId === customerId)
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      bookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.rentalDates.startDate)
        return bookingStart >= start && bookingStart <= end
      })
    }

    // Ensure all bookings have the required new fields
    const enhancedBookings = bookings.map(booking => ({
      ...booking,
      history: booking.history || [],
      payment: {
        ...booking.payment,
        additionalPayments: booking.payment.additionalPayments || [],
        totalPaid: booking.payment.totalPaid || (
          (booking.payment.depositStatus === 'captured' ? booking.pricing.depositAmount : 0) +
          (booking.payment.finalPaymentStatus === 'succeeded' ? booking.pricing.finalAmount : 0)
        )
      }
    }))

    // Sort by creation date (newest first)
    enhancedBookings.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      bookings: enhancedBookings
    })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}