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
  const gran = (params.get('granularity') || 'day').toLowerCase()
  const granularity: 'day' | 'week' | 'month' = ['day', 'week', 'month'].includes(gran) ? (gran as any) : 'day'
  return { from, to, granularity }
}

function bucketFor(ts: number, granularity: 'day' | 'week' | 'month'): string {
  const d = new Date(ts * 1000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  if (granularity === 'day') return `${y}-${m}-${day}`
  if (granularity === 'week') {
    // ISO week key: YYYY-Www
    const tmp = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()))
    // Thursday-based week number
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
    const y2 = tmp.getUTCFullYear()
    const jan1 = new Date(Date.UTC(y2, 0, 1))
    const week = Math.ceil(((+tmp - +jan1) / 86400000 + 1) / 7)
    return `${y2}-W${String(week).padStart(2, '0')}`
  }
  // month
  return `${y}-${m}`
}

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const modeParam = (searchParams.get('mode') || 'live').toLowerCase()
    const mode: 'live' | 'test' = modeParam === 'test' ? 'test' : 'live'
    const { from, to, granularity } = parseRange(searchParams)

    const stripe = getStripe(mode)

    type Bucket = { t: string; grossVolume: number; paymentsCount: number; failedCount: number }
    const buckets = new Map<string, Bucket>()

    // Initialize buckets across range for continuity
    const daySec = 86400
    const step = granularity === 'day' ? daySec : granularity === 'week' ? daySec * 7 : daySec * 30
    for (let t = from; t <= to; t += step) {
      const key = bucketFor(t, granularity)
      if (!buckets.has(key)) buckets.set(key, { t: key, grossVolume: 0, paymentsCount: 0, failedCount: 0 })
    }

    // Succeeded charges for gross volume and paymentsCount
    await stripe.charges
      .list({ created: { gte: from, lte: to }, limit: 100 })
      .autoPagingEach((charge) => {
        const key = bucketFor(charge.created, granularity)
        if (!buckets.has(key)) buckets.set(key, { t: key, grossVolume: 0, paymentsCount: 0, failedCount: 0 })
        const b = buckets.get(key)!
        if (charge.paid && charge.status === 'succeeded') {
          b.grossVolume += charge.amount
          b.paymentsCount += 1
        }
        return true
      })

    // Failed payments from payment intents
    await stripe.paymentIntents
      .list({ created: { gte: from, lte: to }, limit: 100 })
      .autoPagingEach((pi) => {
        const key = bucketFor(pi.created, granularity)
        if (!buckets.has(key)) buckets.set(key, { t: key, grossVolume: 0, paymentsCount: 0, failedCount: 0 })
        const b = buckets.get(key)!
        if (pi.status === 'canceled' || !!pi.last_payment_error) {
          b.failedCount += 1
        }
        return true
      })

    // Return sorted by time key
    const series = Array.from(buckets.values()).sort((a, b) => a.t.localeCompare(b.t))

    return NextResponse.json({ success: true, mode, range: { from, to }, granularity, series })
  } catch (err) {
    console.error('Metrics timeseries error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
