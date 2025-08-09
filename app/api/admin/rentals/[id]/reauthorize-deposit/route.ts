import { NextRequest, NextResponse } from 'next/server'
import kvRentalDB from '@/app/lib/kv-database'
import stripe from '@/app/lib/stripe'
import { validateSession } from '@/app/lib/auth'

// Secure admin authentication using JWT
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.substring(7)
  try {
    const user = await validateSession(token)
    return user !== null && user.role === 'admin'
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const rental = await kvRentalDB.getRental(id)

    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
    }

    // Prefer a previously saved payment method for off-session re-authorization
    const savedPm = rental.payment.savedPaymentMethodId
    if (!savedPm) {
      return NextResponse.json(
        { error: 'No saved payment method on file. Ask customer to re-enter card to authorize the deposit.' },
        { status: 400 }
      )
    }

    // Create a new manual-capture PaymentIntent to (re)authorize the deposit
    const depositAmountCents = Math.round(rental.pricing.depositAmount * 100)
    const reauthPI = await stripe.paymentIntents.create({
      amount: depositAmountCents,
      currency: 'usd',
      customer: rental.payment.stripeCustomerId,
      payment_method: savedPm,
      capture_method: 'manual',
      confirm: true,
      off_session: true,
      description: `Re-authorize Security Deposit for rental ${id}`,
      metadata: {
        rental_id: id,
        type: 'deposit_reauthorization'
      }
    })

    // Persist the new PaymentIntent id so subsequent capture targets the fresh authorization
    await kvRentalDB.updateRental(id, {
      payment: {
        ...rental.payment,
        depositPaymentIntentId: reauthPI.id,
        // Keep status as pending; UI will rely on Stripe status/amount_capturable
        depositStatus: 'pending',
        savedPaymentMethodId: savedPm
      },
      updatedAt: new Date().toISOString()
    })

    const flat = {
      id: reauthPI.id,
      status: reauthPI.status,
      amount: reauthPI.amount,
      amountCapturable: (reauthPI as any).amount_capturable ?? null
    }

    // If authentication is required, inform the admin so they can contact the customer
    let note: string | undefined
    if (reauthPI.status === 'requires_action') {
      note = 'Customer authentication is required to complete the authorization.'
    } else if (reauthPI.status !== 'requires_capture') {
      note = `Authorization attempt returned status: ${reauthPI.status}`
    }

    return NextResponse.json({
      success: true,
      data: { paymentIntent: flat, note }
    })
  } catch (error: any) {
    console.error('Re-authorize deposit error:', error)
    const msg = error?.message || 'Failed to re-authorize deposit'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
