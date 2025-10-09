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

// In-memory fallback when KV is unavailable (best-effort, ephemeral)
const memStore = new Map<string, PromoRecord>()
const memStatsStore = new Map<string, PromoStats>()

async function getPromo(code: string): Promise<PromoRecord | null> {
  try {
    const data = await kv.get<PromoRecord>(codeKey(code))
    return (data as any) || null
  } catch (e) {
    return memStore.get(code.toUpperCase()) || null
  }
}

async function setPromo(record: PromoRecord): Promise<void> {
  try {
    await kv.set(codeKey(record.code), record)
  } catch (e) {
    memStore.set(record.code.toUpperCase(), record)
  }
}

async function listPromos(): Promise<PromoRecord[]> {
  try {
    // If you later maintain an index set, switch to scanning the index
    // For now, rely on KV scan prefix
    const iter = kv.scanIterator({ match: 'promo:code:*' }) as any
    const results: PromoRecord[] = []
    for await (const key of iter) {
      const rec = await kv.get<PromoRecord>(key as string)
      if (rec) results.push(rec as any)
    }
    // Newest first
    results.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    return results
  } catch (e) {
    // Fallback to in-memory
    const results = Array.from(memStore.values())
    results.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    return results
  }
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
  try {
    const stats = ((await kv.get<PromoStats>(key)) as any) || { totalUses: 0 }
    const updated: PromoStats = { totalUses: (stats.totalUses || 0) + 1, lastUsedAt: new Date().toISOString() }
    await kv.set(key, updated)
    return updated
  } catch (e) {
    const cur = memStatsStore.get(code.toUpperCase()) || { totalUses: 0 }
    const updated: PromoStats = { totalUses: (cur.totalUses || 0) + 1, lastUsedAt: new Date().toISOString() }
    memStatsStore.set(code.toUpperCase(), updated)
    return updated
  }
}

async function getStats(code: string): Promise<PromoStats> {
  try {
    const stats = (await kv.get<PromoStats>(statsKey(code))) as any
    return stats || { totalUses: 0 }
  } catch (e) {
    return memStatsStore.get(code.toUpperCase()) || { totalUses: 0 }
  }
}

async function deletePromo(code: string): Promise<boolean> {
  try {
    const upperCode = code.toUpperCase()
    await kv.del(codeKey(upperCode))
    await kv.del(statsKey(upperCode))
    return true
  } catch (e) {
    const upperCode = code.toUpperCase()
    memStore.delete(upperCode)
    memStatsStore.delete(upperCode)
    return true
  }
}

export default {
  getPromo,
  setPromo,
  listPromos,
  updatePromo,
  incrementStats,
  getStats,
  deletePromo,
}
