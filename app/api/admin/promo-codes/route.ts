// Ensure Node.js runtime for Stripe SDK compatibility
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit'
// Defer KV-heavy promo database import to runtime within handlers
type PromoRecord = {
  code: string
  stripeCouponId?: string
  stripePromotionCodeId?: string
  partnerId?: string
  partnerName?: string
  percentOff?: number
  amountOff?: number
  currency?: string
  active: boolean
  maxRedemptions?: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

// GET: list promo codes
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rl = await adminApiRateLimiter.checkLimit(clientId)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    // Lazy import promo DB to avoid module-evaluation errors if KV is misbundled
    const promoDB = (await import('@/app/lib/promo-database')).default
    let promos: PromoRecord[] = []
    try {
      promos = await promoDB.listPromos()
    } catch (e) {
      console.warn('[ADMIN PROMO GET] listPromos failed, returning empty list', e)
      promos = []
    }
    // attach stats (best-effort)
    const withStats = await Promise.all(promos.map(async p => {
      try {
        return { ...p, stats: await promoDB.getStats(p.code) }
      } catch (e) {
        console.warn('[ADMIN PROMO GET] getStats failed', { code: p.code, e })
        return { ...p, stats: { totalUses: 0 } }
      }
    }))

    return NextResponse.json({ promos: withStats })
  } catch (err) {
    console.error('[ADMIN PROMO GET] error', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to list promos', details: msg }, { status: 500 })
  }
}

// POST: create promo code (Stripe coupon + promotion code)
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rl = await adminApiRateLimiter.checkLimit(clientId)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    console.log('[ADMIN PROMO POST] Request body:', JSON.stringify(body, null, 2))
    
    const {
      code,
      percentOff,
      amountOff,
      currency = 'usd',
      partnerId,
      partnerName,
      maxRedemptions,
      expiresAt, // ISO
      active = true,
    } = body || {}

    if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 })
    if ((percentOff == null && amountOff == null) || (percentOff != null && amountOff != null)) {
      return NextResponse.json({ error: 'Provide either percentOff or amountOff' }, { status: 400 })
    }

    console.log('[ADMIN PROMO POST] Checking for existing promo:', code)
    
    // Check if promo code already exists
    const promoDB = (await import('@/app/lib/promo-database')).default
    const existing = await promoDB.getPromo(String(code).toUpperCase())
    if (existing) {
      console.log('[ADMIN PROMO POST] Promo code already exists:', code)
      return NextResponse.json({ error: 'Promo code already exists' }, { status: 409 })
    }
    
    console.log('[ADMIN PROMO POST] Promo code does not exist, proceeding with creation')

    // If Stripe secret is missing, fall back to local-only record (no Stripe objects)
    const hasStripe = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')

    let stripeCouponId: string | undefined
    let stripePromotionCodeId: string | undefined

    if (hasStripe) {
      try {
        console.log('[ADMIN PROMO POST] Creating Stripe coupon and promotion code')
        // Import Stripe lazily to avoid Edge/runtime issues on routes that don't need it
        const stripe = (await import('@/app/lib/stripe')).default
        
        // Create Stripe coupon
        console.log('[ADMIN PROMO POST] Creating Stripe coupon with:', {
          percent_off: percentOff,
          amount_off: amountOff,
          currency,
        })
        const coupon = await stripe.coupons.create({
          percent_off: percentOff ?? undefined,
          amount_off: amountOff != null ? Math.round(amountOff * 100) : undefined,
          currency: amountOff != null ? currency : undefined,
          duration: 'forever',
          metadata: {
            partner_id: partnerId || '',
            partner_name: partnerName || '',
          }
        })
        console.log('[ADMIN PROMO POST] Stripe coupon created:', coupon.id)

        // Create Promotion Code with provided human-readable code
        console.log('[ADMIN PROMO POST] Creating Stripe promotion code')
        const promo = await stripe.promotionCodes.create({
          code: String(code).toUpperCase(),
          coupon: coupon.id,
          active,
          max_redemptions: maxRedemptions ?? undefined,
          restrictions: {},
          expires_at: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined,
          metadata: {
            partner_id: partnerId || '',
            partner_name: partnerName || '',
          }
        })
        console.log('[ADMIN PROMO POST] Stripe promotion code created:', promo.id)

        stripeCouponId = coupon.id
        stripePromotionCodeId = promo.id
      } catch (stripeErr) {
        console.error('[ADMIN PROMO POST] Stripe error', stripeErr)
        const stripeMsg = stripeErr instanceof Error ? stripeErr.message : 'Stripe API error'
        return NextResponse.json({ error: 'Failed to create Stripe promo code', details: stripeMsg }, { status: 500 })
      }
    } else {
      // Local fallback identifiers
      stripeCouponId = `local_coupon_${String(code).toUpperCase()}`
      stripePromotionCodeId = `local_promo_${String(code).toUpperCase()}`
      console.warn('[ADMIN PROMO POST] STRIPE_SECRET_KEY not configured; created local-only promo', { code })
    }

    const now = new Date().toISOString()
    const record: PromoRecord = {
      code: String(code).toUpperCase(),
      stripeCouponId,
      stripePromotionCodeId,
      partnerId,
      partnerName,
      percentOff: percentOff ?? undefined,
      amountOff: amountOff ?? undefined,
      currency: amountOff != null ? currency : undefined,
      active: active,
      maxRedemptions: maxRedemptions,
      expiresAt: expiresAt ?? undefined,
      createdAt: now,
      updatedAt: now,
    }

    await promoDB.setPromo(record)

    return NextResponse.json({ promo: record })
  } catch (err) {
    console.error('[ADMIN PROMO POST] error', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create promo', details: msg }, { status: 500 })
  }
}
