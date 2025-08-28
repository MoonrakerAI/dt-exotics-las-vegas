import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

function isKvConfigured(): boolean {
  const env = process.env as Record<string, string | undefined>
  return Boolean(
    (env.VERCEL_KV_REST_API_URL && env.VERCEL_KV_REST_API_TOKEN) ||
      (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) ||
      env.KV_URL ||
      env.REDIS_URL
  )
}

export async function GET() {
  const env = process.env as Record<string, string | undefined>

  const checks: Record<string, any> = {
    jwtSecretPresent: Boolean(env.JWT_SECRET && env.JWT_SECRET.trim() !== ''),
    stripeLiveKeyPresent: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.trim() !== ''),
    stripeTestKeyPresent: Boolean(env.STRIPE_TEST_SECRET_KEY && env.STRIPE_TEST_SECRET_KEY.trim() !== ''),
    resendKeyPresent: Boolean(env.RESEND_API_KEY && env.RESEND_API_KEY.trim() !== ''),
    kvConfigured: isKvConfigured(),
    kvReachable: false,
    errors: [] as string[],
  }

  if (checks.kvConfigured) {
    try {
      // Perform a tiny KV check with a short TTL
      const key = 'health:admin'
      const now = Date.now().toString()
      await kv.set(key, now, { ex: 30 })
      const val = await kv.get<string>(key)
      checks.kvReachable = val === now
    } catch (e: any) {
      checks.errors.push(`KV error: ${e?.message || 'unknown'}`)
      checks.kvReachable = false
    }
  }

  return NextResponse.json({ ok: true, checks })
}
