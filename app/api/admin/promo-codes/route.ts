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

    const promos = await promoDB.listPromos()
    // attach stats
    const withStats = await Promise.all(promos.map(async p => ({
      ...p,
      stats: await promoDB.getStats(p.code)
    })))

    return NextResponse.json({ promos: withStats })
  } catch (err) {
    console.error('[ADMIN PROMO GET] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    const now = new Date().toISOString()
    const record: PromoRecord = {
      code: String(code).toUpperCase(),
      stripeCouponId: coupon.id,
      stripePromotionCodeId: promo.id,
      partnerId,
      partnerName,
      percentOff: percentOff ?? undefined,
      amountOff: amountOff ?? undefined,
      currency: amountOff != null ? currency : undefined,
      active: promo.active ?? true,
      maxRedemptions: promo.max_redemptions ?? maxRedemptions,
      expiresAt: expiresAt ?? (promo.expires_at ? new Date(promo.expires_at * 1000).toISOString() : undefined),
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
