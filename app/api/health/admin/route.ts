import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

function isKvConfigured(): boolean {
  const env = process.env as Record<string, string | undefined>
  return Boolean(
    (env.VERCEL_KV_REST_API_URL && (env.VERCEL_KV_REST_API_TOKEN || env.VERCEL_KV_REST_API_READ_ONLY_TOKEN)) ||
      (env.KV_REST_API_URL && (env.KV_REST_API_TOKEN || env.KV_REST_API_READ_ONLY_TOKEN)) ||
      env.KV_URL ||
      env.REDIS_URL
  )
}

function isKvWriteCapable(): boolean {
  const env = process.env as Record<string, string | undefined>
  return Boolean(
    env.VERCEL_KV_REST_API_TOKEN ||
      env.KV_REST_API_TOKEN ||
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
    kvWriteCapable: isKvWriteCapable(),
    kvReachable: false,
    errors: [] as string[],
  }

  if (checks.kvConfigured) {
    try {
      const key = 'health:admin'
      if (checks.kvWriteCapable) {
        // Write + read loopback check when write is allowed
        const now = Date.now().toString()
        await kv.set(key, now, { ex: 30 })
        const val = await kv.get<string>(key)
        checks.kvReachable = val === now
      } else {
        // Read-only environments: perform a harmless read
        // Using a non-existent key should resolve to null without throwing if reachable
        const val = await kv.get<string>(key)
        checks.kvReachable = val === null || typeof val === 'string'
      }
    } catch (e: any) {
      checks.errors.push(`KV error: ${e?.message || 'unknown'}`)
      checks.kvReachable = false
    }
  }

  return NextResponse.json({ ok: true, checks })
}
