import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import kvRentalDB from '@/app/lib/kv-database'
import stripe from '@/app/lib/stripe'
import { AdditionalPayment, RentalHistory } from '@/app/types/rental'

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
    const { amount, description } = body

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
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

    // Check if rental has a Stripe customer
    if (!rental.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No payment method available for this rental' },
        { status: 400 }
      )
    }

    // Get customer's payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: rental.stripeCustomerId,
      type: 'card'
    })

    if (paymentMethods.data.length === 0) {
      return NextResponse.json(
        { error: 'No payment method found for customer' },
        { status: 400 }
      )
    }

    // Use the first available payment method
    const paymentMethodId = paymentMethods.data[0].id

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: rental.stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${process.env.NEXTAUTH_URL}/admin/bookings`,
      description: `Additional charge for rental ${rental.id}: ${description}`,
      metadata: {
        rentalId: rental.id,
        type: 'additional_payment',
        adminId: user.id
      }
    })

    // Create additional payment record
    const additionalPayment: AdditionalPayment = {
      id: `add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      description,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
      createdAt: new Date().toISOString(),
      processedBy: user.id
    }

    // Update rental with additional payment
    const updatedPayment = {
      ...rental.payment,
      additionalPayments: [
        ...(rental.payment.additionalPayments || []),
        additionalPayment
      ],
      totalPaid: (rental.payment.totalPaid || 0) + 
        (additionalPayment.status === 'succeeded' ? amount : 0)
    }

    // Add history entry
    const historyEntry: RentalHistory = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: 'additional_payment',
      description: `Additional payment of $${amount.toFixed(2)} charged: ${description}`,
      performedBy: user.email,
      metadata: {
        amount,
        description,
        paymentIntentId: paymentIntent.id,
        status: additionalPayment.status
      },
      createdAt: new Date().toISOString()
    }

    const updatedRental = await kvRentalDB.updateRental(rentalId, {
      payment: updatedPayment,
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
      additionalPayment,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount
      },
      requiresAuth: paymentIntent.status === 'requires_action'
    })

  } catch (error) {
    console.error('Error processing additional payment:', error)
    
    if (error instanceof Error && error.message.includes('card_declined')) {
      return NextResponse.json(
        { error: 'Payment was declined. Please contact the customer.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}