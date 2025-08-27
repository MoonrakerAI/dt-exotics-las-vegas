import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { kv } from '@vercel/kv'

async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.substring(7)
  
  // Simple token validation - check if token exists and has reasonable length
  if (!token || token.length < 10) {
    return false
  }
  
  return true
}

function getStripe(mode: 'live' | 'test' = 'live') {
  const liveKey = process.env.STRIPE_SECRET_KEY
  const testKey = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY
  const apiKey = mode === 'test' ? testKey : liveKey
  if (!apiKey) {
    return null as unknown as Stripe
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

    // KV cache lookup with versioned key (best-effort)
    let version = 0
    let cacheKey = ''
    try {
      version = (await kv.get<number>(`stripe:metrics:version:${mode}`)) || 0
      cacheKey = `stripe:metrics:overview:${mode}:v${version}:${from}:${to}`
      const cached = await kv.get<any>(cacheKey)
      if (cached) {
        return NextResponse.json(cached)
      }
    } catch {
      // KV not configured or transient failure; continue without cache
    }

    const stripe = getStripe(mode)
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe API key not configured' }, { status: 503 })
    }

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

    const payload = {
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
    }

    // store in cache for short TTL (90s) – best-effort
    try {
      if (cacheKey) {
        await kv.set(cacheKey, payload, { ex: 90 })
      }
    } catch {
      // ignore cache write failures
    }
    return NextResponse.json(payload)
  } catch (err) {
    console.error('Metrics overview error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
