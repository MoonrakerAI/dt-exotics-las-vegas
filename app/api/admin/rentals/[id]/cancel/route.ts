import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import kvRentalDB from '@/app/lib/kv-database'
import stripe from '@/app/lib/stripe'
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
    const { reason, refundAmount } = body

    // Get rental booking
    const rental = await kvRentalDB.getRental(rentalId)
    if (!rental) {
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      )
    }

    // Check if rental can be cancelled
    if (rental.status === 'cancelled' || rental.status === 'completed') {
      return NextResponse.json(
        { error: 'Rental cannot be cancelled in current status' },
        { status: 400 }
      )
    }

    let refundResult = null

    // Process refund if requested and there's a captured payment
    if (refundAmount && refundAmount > 0) {
      try {
        // Check if deposit was captured
        if (rental.payment.depositStatus === 'captured' && rental.payment.depositPaymentIntentId) {
          const refund = await stripe.refunds.create({
            payment_intent: rental.payment.depositPaymentIntentId,
            amount: Math.round(refundAmount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              rentalId: rental.id,
              adminId: user.id,
              cancelReason: reason || 'Cancelled by admin'
            }
          })
          refundResult = refund
        }

        // Check if final payment was processed
        if (rental.payment.finalPaymentStatus === 'succeeded' && rental.payment.finalPaymentIntentId) {
          const refund = await stripe.refunds.create({
            payment_intent: rental.payment.finalPaymentIntentId,
            amount: Math.round(refundAmount * 100),
            reason: 'requested_by_customer',
            metadata: {
              rentalId: rental.id,
              adminId: user.id,
              cancelReason: reason || 'Cancelled by admin'
            }
          })
          refundResult = refund
        }
      } catch (refundError) {
        console.error('Refund error:', refundError)
        // Continue with cancellation even if refund fails
      }
    }

    // Add history entry
    const historyEntry: RentalHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'cancelled',
      description: `Booking cancelled by admin: ${reason || 'No reason provided'}`,
      performedBy: user.email,
      metadata: {
        reason,
        refundAmount,
        refundId: refundResult?.id,
        previousStatus: rental.status
      },
      createdAt: new Date().toISOString()
    }

    // Update rental status
    const updatedRental = await kvRentalDB.updateRental(rentalId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
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
      refund: refundResult ? {
        id: refundResult.id,
        amount: refundResult.amount / 100,
        status: refundResult.status
      } : null
    })

  } catch (error) {
    console.error('Error cancelling rental:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}