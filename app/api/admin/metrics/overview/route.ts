import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { validateSession } from '@/app/lib/auth'

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

function getStripe(mode: 'live' | 'test' = 'live') {
  const liveKey = process.env.STRIPE_SECRET_KEY
  const testKey = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY
  const apiKey = mode === 'test' ? testKey : liveKey
  if (!apiKey) {
    throw new Error('Stripe API key not configured')
  }
  return new Stripe(apiKey)
}

function parseRange(params: URLSearchParams) {
  const now = Math.floor(Date.now() / 1000)
  const to = Number(params.get('to')) || now
  const from = Number(params.get('from')) || (to - 60 * 60 * 24 * 30) // default 30d
  return { from, to }
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const modeParam = (searchParams.get('mode') || 'live').toLowerCase()
    const mode: 'live' | 'test' = modeParam === 'test' ? 'test' : 'live'
    const { from, to } = parseRange(searchParams)

    const stripe = getStripe(mode)

    // Gross volume and payments count from succeeded charges
    let grossVolume = 0
    let paymentsCount = 0
    let uniquePayers = new Set<string>()

    const chargeParams: Stripe.ChargeListParams = {
      created: { gte: from, lte: to },
      limit: 100,
      expand: [],
    }

    await stripe.charges
      .list(chargeParams)
      .autoPagingEach((charge) => {
        if (charge.paid && charge.status === 'succeeded') {
          grossVolume += charge.amount
          paymentsCount += 1
          if (charge.customer) uniquePayers.add(String(charge.customer))
        }
        return true
      })

    // Failed payments from payment intents
    let failedPayments = 0
    const piParams: Stripe.PaymentIntentListParams = {
      created: { gte: from, lte: to },
      limit: 100,
    }
    await stripe.paymentIntents
      .list(piParams)
      .autoPagingEach((pi) => {
        if (pi.status === 'canceled' || !!pi.last_payment_error) {
          failedPayments += 1
        }
        return true
      })

    // New customers in range
    let newCustomers = 0
    const custParams: Stripe.CustomerListParams = {
      created: { gte: from, lte: to },
      limit: 100,
    }
    await stripe.customers
      .list(custParams)
      .autoPagingEach((_c) => {
        newCustomers += 1
        return true
      })

    const avgSpend = uniquePayers.size > 0 ? Math.round(grossVolume / uniquePayers.size) : 0

    return NextResponse.json({
      success: true,
      mode,
      range: { from, to },
      metrics: {
        grossVolume, // in cents
        paymentsCount,
        failedPayments,
        newCustomers,
        avgSpend, // in cents
        uniquePayingCustomers: uniquePayers.size,
      },
    })
  } catch (err) {
    console.error('Metrics overview error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
