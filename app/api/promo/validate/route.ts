import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/app/lib/stripe'
import promoDB from '@/app/lib/promo-database'
import { apiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const rl = await apiRateLimiter.checkLimit(getClientIdentifier(request))
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const body = await request.json().catch(() => ({}))
    const codeInput = String(body.code || '').trim().toUpperCase()
    if (!codeInput) return NextResponse.json({ valid: false, error: 'Code required' }, { status: 400 })

    // Prefer our KV record
    let record = await promoDB.getPromo(codeInput)
    let promoCode: Stripe.PromotionCode | null = null
    let coupon: Stripe.Coupon | null = null

    if (record?.stripePromotionCodeId) {
      try {
        promoCode = await stripe.promotionCodes.retrieve(record.stripePromotionCodeId)
      } catch {
        promoCode = null
      }
    }

    if (!promoCode) {
      // Fallback: search by code in Stripe
      const list = await stripe.promotionCodes.list({ code: codeInput, limit: 1 })
      promoCode = list.data[0] || null
      if (promoCode && !record) {
        // Partial reconstruction if admin created directly in Stripe
        record = {
          code: codeInput,
          stripePromotionCodeId: promoCode.id,
          stripeCouponId: typeof promoCode.coupon === 'string' ? promoCode.coupon : promoCode.coupon.id,
          active: promoCode.active,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    }

    if (!promoCode || (!promoCode.active && (record?.active !== true))) {
      return NextResponse.json({ valid: false, error: 'Invalid or inactive code' }, { status: 400 })
    }

    // Load coupon
    if (typeof promoCode.coupon === 'string') {
      coupon = await stripe.coupons.retrieve(promoCode.coupon)
    } else {
      coupon = promoCode.coupon
    }

    // Expiry check
    const expiresAt = promoCode.expires_at ? new Date(promoCode.expires_at * 1000) : (record?.expiresAt ? new Date(record.expiresAt) : undefined)
    if (expiresAt && Date.now() > +expiresAt) {
      return NextResponse.json({ valid: false, error: 'Code expired' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      code: codeInput,
      percentOff: coupon?.percent_off ?? undefined,
      amountOff: coupon?.amount_off ? coupon.amount_off / 100 : undefined,
      currency: coupon?.currency ?? record?.currency ?? 'usd',
      partnerId: record?.partnerId,
      partnerName: record?.partnerName,
      stripePromotionCodeId: promoCode.id,
      stripeCouponId: typeof promoCode.coupon === 'string' ? promoCode.coupon : promoCode.coupon.id,
      maxRedemptions: promoCode.max_redemptions ?? record?.maxRedemptions,
      timesRedeemed: promoCode.times_redeemed,
      expiresAt: expiresAt?.toISOString(),
    })
  } catch (err) {
    console.error('[PROMO VALIDATE] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
