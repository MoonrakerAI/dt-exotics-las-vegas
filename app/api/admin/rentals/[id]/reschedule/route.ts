import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import kvRentalDB from '@/app/lib/kv-database'
import { RentalHistory } from '@/app/types/rental'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id: rentalId } = params
    const body = await request.json()
    const { startDate, endDate, reason } = body

    // Validate input
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Get rental booking
    const rental = await kvRentalDB.getRental(rentalId)
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      )
    }

    // Check if rental can be rescheduled
    if (rental.status === 'cancelled' || rental.status === 'completed') {
      return NextResponse.json(
        { error: 'Rental cannot be rescheduled in current status' },
        { status: 400 }
      )
    }

    // Check car availability for new dates (excluding current rental)
    const isAvailable = await kvRentalDB.isCarAvailable(
      rental.carId,
      startDate,
      endDate,
      rentalId // Exclude current rental from availability check
    )

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Car is not available for the selected dates' },
        { status: 400 }
      )
    }

    // Calculate new pricing
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const dailyRate = rental.pricing.dailyRate
    const newSubtotal = daysDiff * dailyRate
    const newDepositAmount = Math.round(newSubtotal * 0.3) // 30% deposit
    const newFinalAmount = newSubtotal - newDepositAmount

    // Store original dates if not already stored
    const originalDates = rental.originalDates || {
      startDate: rental.rentalDates.startDate,
      endDate: rental.rentalDates.endDate
    }

    // Add history entry
    const historyEntry: RentalHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'rescheduled',
      description: `Booking rescheduled by admin: ${reason || 'No reason provided'}`,
      performedBy: user.email,
      metadata: {
        reason,
        oldStartDate: rental.rentalDates.startDate,
        oldEndDate: rental.rentalDates.endDate,
        newStartDate: startDate,
        newEndDate: endDate,
        oldDays: rental.pricing.totalDays,
        newDays: daysDiff,
        oldSubtotal: rental.pricing.subtotal,
        newSubtotal
      },
      createdAt: new Date().toISOString()
    }

    // Update rental with new dates and pricing
    const updatedRental = await kvRentalDB.updateRental(rentalId, {
      rentalDates: {
        startDate,
        endDate
      },
      originalDates,
      pricing: {
        ...rental.pricing,
        totalDays: daysDiff,
        subtotal: newSubtotal,
        depositAmount: newDepositAmount,
        finalAmount: newFinalAmount
      },
      status: 'rescheduled',
      history: [...(rental.history || []), historyEntry],
      updatedAt: new Date().toISOString()
    })

    if (!updatedRental) {
      return NextResponse.json(
        { error: 'Failed to update rental' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rental: updatedRental,
      pricingChange: {
        oldSubtotal: rental.pricing.subtotal,
        newSubtotal,
        difference: newSubtotal - rental.pricing.subtotal,
        oldDays: rental.pricing.totalDays,
        newDays: daysDiff
      }
    })

  } catch (error) {
    console.error('Error rescheduling rental:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}