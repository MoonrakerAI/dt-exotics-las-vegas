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
    const limit = Math.min(Number(searchParams.get('limit')) || 10, 50)
    const { from, to } = parseRange(searchParams)

    // KV cache lookup with versioned key
    const version = (await kv.get<number>(`stripe:metrics:version:${mode}`)) || 0
    const cacheKey = `stripe:metrics:top-customers:${mode}:v${version}:${from}:${to}:limit${limit}`
    const cached = await kv.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const stripe = getStripe(mode)

    // Aggregate succeeded charge amounts per customer
    const totals = new Map<string, { amount: number; count: number }>()

    await stripe.charges
      .list({ created: { gte: from, lte: to }, limit: 100 })
      .autoPagingEach((charge) => {
        if (charge.paid && charge.status === 'succeeded' && charge.customer) {
          const id = String(charge.customer)
          const prev = totals.get(id) || { amount: 0, count: 0 }
          prev.amount += charge.amount
          prev.count += 1
          totals.set(id, prev)
        }
        return true
      })

    // Sort and take top N
    const sorted = Array.from(totals.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, limit)

    // Fetch customer details
    const results = [] as Array<{ customerId: string; email: string | null; name: string | null; totalSpend: number; paymentsCount: number }>
    for (const [customerId, agg] of sorted) {
      const cust = await stripe.customers.retrieve(customerId)
      if (cust && (cust as any).id) {
        const c = cust as Stripe.Customer
        results.push({
          customerId,
          email: c.email || null,
          name: (c.name || [c.address?.line1, c.address?.city].filter(Boolean).join(', ')) || null,
          totalSpend: agg.amount,
          paymentsCount: agg.count,
        })
      }
    }

    const payload = { success: true, mode, range: { from, to }, topCustomers: results }
    await kv.set(cacheKey, payload, { ex: 90 })
    return NextResponse.json(payload)
  } catch (err) {
    console.error('Metrics top-customers error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
