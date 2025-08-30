import { kv } from '@vercel/kv'

export interface PromoRecord {
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
  expiresAt?: string // ISO string
  createdAt: string
  updatedAt: string
}

export interface PromoStats {
  totalUses: number
  lastUsedAt?: string
}

const codeKey = (code: string) => `promo:code:${code.toUpperCase()}`
const statsKey = (code: string) => `promo:stats:${code.toUpperCase()}`

async function getPromo(code: string): Promise<PromoRecord | null> {
  const data = await kv.get<PromoRecord>(codeKey(code))
  return (data as any) || null
}

async function setPromo(record: PromoRecord): Promise<void> {
  await kv.set(codeKey(record.code), record)
}

async function listPromos(): Promise<PromoRecord[]> {
  // If you later maintain an index set, switch to scanning the index
  // For now, rely on KV scan prefix
  const iter = kv.scanIterator({ match: 'promo:code:*' }) as any
  const results: PromoRecord[] = []
  for await (const { key } of iter) {
    const rec = await kv.get<PromoRecord>(key)
    if (rec) results.push(rec as any)
  }
  // Newest first
  results.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  return results
}

async function updatePromo(code: string, updates: Partial<PromoRecord>): Promise<PromoRecord | null> {
  const existing = await getPromo(code)
  if (!existing) return null
  const updated: PromoRecord = { ...existing, ...updates, code: existing.code, updatedAt: new Date().toISOString() }
  await setPromo(updated)
  return updated
}

async function incrementStats(code: string): Promise<PromoStats> {
  const key = statsKey(code)
  const stats = ((await kv.get<PromoStats>(key)) as any) || { totalUses: 0 }
  const updated: PromoStats = { totalUses: (stats.totalUses || 0) + 1, lastUsedAt: new Date().toISOString() }
  await kv.set(key, updated)
  return updated
}

async function getStats(code: string): Promise<PromoStats> {
  const stats = (await kv.get<PromoStats>(statsKey(code))) as any
  return stats || { totalUses: 0 }
}

export default {
  getPromo,
  setPromo,
  listPromos,
  updatePromo,
  incrementStats,
  getStats,
}
