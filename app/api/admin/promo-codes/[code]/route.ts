import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/app/lib/stripe'
import { verifyJWT } from '@/app/lib/auth'
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit'
import promoDB from '@/app/lib/promo-database'

// PATCH: update/toggle promo code by code
export async function PATCH(request: NextRequest, context: any) {
  try {
    const clientId = getClientIdentifier(request)
    const rl = await adminApiRateLimiter.checkLimit(clientId)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const code = String(context?.params?.code || '').toUpperCase()
    const body = await request.json().catch(() => ({}))

    const existing = await promoDB.getPromo(code)
    if (!existing) return NextResponse.json({ error: 'Promo not found' }, { status: 404 })

    // Allowed updates
    const { active, maxRedemptions, expiresAt, partnerId, partnerName } = body || {}

    // Update Stripe promotion code if needed
    if (existing.stripePromotionCodeId) {
      const updates: any = {}
      if (typeof active === 'boolean') updates.active = active
      if (typeof maxRedemptions === 'number') updates.max_redemptions = maxRedemptions
      if (expiresAt) updates.expires_at = Math.floor(new Date(expiresAt).getTime() / 1000)
      if (partnerId != null || partnerName != null) {
        updates.metadata = {
          partner_id: partnerId ?? existing.partnerId ?? '',
          partner_name: partnerName ?? existing.partnerName ?? '',
        }
      }
      if (Object.keys(updates).length > 0) {
        await stripe.promotionCodes.update(existing.stripePromotionCodeId, updates)
      }
    }

    const updated = await promoDB.updatePromo(code, {
      active: typeof active === 'boolean' ? active : existing.active,
      maxRedemptions: typeof maxRedemptions === 'number' ? maxRedemptions : existing.maxRedemptions,
      expiresAt: expiresAt ?? existing.expiresAt,
      partnerId: partnerId ?? existing.partnerId,
      partnerName: partnerName ?? existing.partnerName,
    })

    return NextResponse.json({ promo: updated })
  } catch (err) {
    console.error('[ADMIN PROMO PATCH] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: delete promo code by code
export async function DELETE(request: NextRequest, context: any) {
  try {
    const clientId = getClientIdentifier(request)
    const rl = await adminApiRateLimiter.checkLimit(clientId)
    if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const code = String(context?.params?.code || '').toUpperCase()

    const existing = await promoDB.getPromo(code)
    if (!existing) return NextResponse.json({ error: 'Promo not found' }, { status: 404 })

    // Delete from Stripe if it exists there
    if (existing.stripePromotionCodeId && !existing.stripePromotionCodeId.startsWith('local_')) {
      try {
        // Note: Stripe doesn't allow deleting promotion codes, but we can deactivate them
        await stripe.promotionCodes.update(existing.stripePromotionCodeId, { active: false })
      } catch (stripeErr) {
        console.warn('[ADMIN PROMO DELETE] Failed to deactivate Stripe promo code', stripeErr)
        // Continue with local deletion even if Stripe fails
      }
    }

    // Delete from database
    await promoDB.deletePromo(code)

    return NextResponse.json({ success: true, message: 'Promo code deleted' })
  } catch (err) {
    console.error('[ADMIN PROMO DELETE] error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
