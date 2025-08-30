'use client'

import { useEffect, useMemo, useState } from 'react'
import { SimpleAuth } from '@/app/lib/simple-auth'

interface AdminPromoRecord {
  code: string
  percentOff?: number
  amountOff?: number
  active: boolean
  maxRedemptions?: number
  expiresAt?: string
  partnerName?: string
  stats?: { totalUses: number; lastUsedAt?: string }
}

export default function AdminPromoCodesPage() {
  const [mounted, setMounted] = useState(false)
  const [authUser, setAuthUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [promos, setPromos] = useState<AdminPromoRecord[]>([])

  // Create form state
  const [form, setForm] = useState({
    code: '',
    percentOff: '',
    amountOff: '',
    partnerName: '',
    maxRedemptions: '',
    expiresAt: '', // ISO
    active: true,
  })

  useEffect(() => {
    setMounted(true)
    setAuthUser(SimpleAuth.getCurrentUser())
  }, [])

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('dt-admin-token') : null), [mounted])

  useEffect(() => {
    if (!mounted || !token) return
    fetchPromos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, token])

  const fetchPromos = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/promo-codes', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const json = await res.json()
      setPromos(json.promos || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (code: string, next: boolean) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${encodeURIComponent(code)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: next }),
      })
      if (!res.ok) throw new Error(`Toggle failed: ${res.status}`)
      await fetchPromos()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to toggle')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Basic validation: require exactly one of percentOff or amountOff
      const hasPercent = !!form.percentOff
      const hasAmount = !!form.amountOff
      if ((hasPercent && hasAmount) || (!hasPercent && !hasAmount)) {
        alert('Provide either Percent Off or Amount Off (but not both).')
        return
      }
      const payload: any = {
        code: form.code.trim().toUpperCase(),
        active: form.active,
      }
      if (form.percentOff) payload.percentOff = Number(form.percentOff)
      if (form.amountOff) payload.amountOff = Number(form.amountOff)
      if (form.partnerName) payload.partnerName = form.partnerName
      if (form.maxRedemptions) payload.maxRedemptions = Number(form.maxRedemptions)
      if (form.expiresAt) payload.expiresAt = form.expiresAt

      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `Create failed: ${res.status}`)
      setForm({ code: '', percentOff: '', amountOff: '', partnerName: '', maxRedemptions: '', expiresAt: '', active: true })
      await fetchPromos()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create')
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-white">Loading admin…</div>
      </div>
    )
  }
  if (!authUser) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-white">Access denied. Please log in.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-gray">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-tech font-bold text-white">Promo Codes</h1>
          <p className="text-gray-400">Create and manage discount promo codes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <form onSubmit={handleCreate} className="glass-panel bg-dark-metal/50 p-6 border border-gray-700/40 rounded-2xl lg:col-span-1">
            <h2 className="text-xl font-tech text-white mb-4">Create Promo</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Code</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="w-full bg-dark-metal border border-gray-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Percent Off</label>
                  <input type="number" min={0} max={100} value={form.percentOff} onChange={(e) => setForm({ ...form, percentOff: e.target.value, amountOff: '' })} className="w-full bg-dark-metal border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Amount Off</label>
                  <input type="number" min={0} value={form.amountOff} onChange={(e) => setForm({ ...form, amountOff: e.target.value, percentOff: '' })} className="w-full bg-dark-metal border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Partner Name</label>
                <input value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} className="w-full bg-dark-metal border border-gray-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Redemptions</label>
                  <input type="number" min={0} value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} className="w-full bg-dark-metal border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Expires At</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full bg-dark-metal border border-gray-700 rounded-lg px-3 py-2 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input id="active" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                <label htmlFor="active" className="text-gray-300 text-sm">Active</label>
              </div>
              <button type="submit" className="btn-primary w-full">Create</button>
            </div>
          </form>

          <div className="lg:col-span-2 glass-panel bg-dark-metal/50 p-6 border border-gray-700/40 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-tech text-white">Existing Promos</h2>
              <button onClick={fetchPromos} className="btn-secondary">Refresh</button>
            </div>
            {loading ? (
              <div className="text-gray-400">Loading…</div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : promos.length === 0 ? (
              <div className="text-gray-400">No promos found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="py-2 pr-4">Code</th>
                      <th className="py-2 pr-4">Discount</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Max</th>
                      <th className="py-2 pr-4">Used</th>
                      <th className="py-2 pr-4">Partner</th>
                      <th className="py-2 pr-4">Expires</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promos.map((p) => (
                      <tr key={p.code} className="border-b border-gray-800">
                        <td className="py-2 pr-4 text-white font-tech">{p.code}</td>
                        <td className="py-2 pr-4 text-gray-200">
                          {p.percentOff != null ? `${p.percentOff}%` : p.amountOff != null ? `USD ${p.amountOff}` : '—'}
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-1 rounded text-xs ${p.active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="py-2 pr-4 text-gray-300">{p.maxRedemptions ?? '—'}</td>
                        <td className="py-2 pr-4 text-gray-300">{p.stats?.totalUses ?? 0}</td>
                        <td className="py-2 pr-4 text-gray-300">{p.partnerName || '—'}</td>
                        <td className="py-2 pr-4 text-gray-300">{p.expiresAt ? new Date(p.expiresAt).toLocaleString() : '—'}</td>
                        <td className="py-2 pr-4">
                          <button onClick={() => toggleActive(p.code, !p.active)} className="btn-secondary">
                            {p.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
