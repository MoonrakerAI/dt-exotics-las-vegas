import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/app/lib/stripe'
import { verifyJWT } from '@/app/lib/auth'
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit'
import promoDB, { PromoRecord } from '@/app/lib/promo-database'

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

    // If Stripe secret is missing, fall back to local-only record (no Stripe objects)
    const hasStripe = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')

    let stripeCouponId: string | undefined
    let stripePromotionCodeId: string | undefined

    if (hasStripe) {
      // Create Stripe coupon
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

      // Create Promotion Code with provided human-readable code
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

      stripeCouponId = coupon.id
      stripePromotionCodeId = promo.id
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
