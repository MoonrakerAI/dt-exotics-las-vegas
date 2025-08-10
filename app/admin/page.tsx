'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/rental-utils'
import { SimpleAuth } from '../lib/simple-auth'
import { Car, Calendar, DollarSign, Users, TrendingUp, Clock, AlertCircle, CheckCircle, Plus, Eye, Edit, MoreHorizontal } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

type Mode = 'live' | 'test'

interface OverviewMetrics {
  grossVolume: number
  paymentsCount: number
  failedPayments: number
  newCustomers: number
  avgSpend: number
  uniquePayingCustomers: number
}

const formatDateDMY = (iso: string) => {
  const d = new Date(iso)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yy = String(d.getUTCFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

interface TimePoint {
  t: string
  grossVolume: number
  paymentsCount: number
  failedCount: number
}

interface TopCustomer {
  customerId: string
  email: string | null
  name: string | null
  totalSpend: number
  paymentsCount: number
}

function Spinner({ size = 24 }: { size?: number }) {
  return (
    <svg
      className="animate-spin text-neon-blue"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-80" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"></path>
    </svg>
  )
}

function TopCustomersTable({ topCustomers }: { topCustomers: TopCustomer[] }) {
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'paymentsCount' | 'totalSpend'>('totalSpend')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const sorted = [...topCustomers].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'name') return (a.name || '').localeCompare(b.name || '') * dir
    if (sortKey === 'email') return (a.email || '').localeCompare(b.email || '') * dir
    if (sortKey === 'paymentsCount') return (a.paymentsCount - b.paymentsCount) * dir
    return (a.totalSpend - b.totalSpend) * dir
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageItems = sorted.slice(start, start + pageSize)

  const setSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const Th = ({ label, k }: { label: string; k?: typeof sortKey }) => (
    <th
      onClick={k ? () => setSort(k) : undefined}
      className={`text-left py-3 px-4 text-gray-400 font-tech ${k ? 'cursor-pointer select-none hover:text-neon-blue' : ''}`}
    >
      {label}
      {k && sortKey === k && (
        <span className="ml-1 text-xs text-gray-500">{sortDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </th>
  )

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <Th label="Customer" k="name" />
              <Th label="Email" k="email" />
              <Th label="Payments" k="paymentsCount" />
              <Th label="Total Spend" k="totalSpend" />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c) => (
              <tr key={c.customerId} className="border-b border-gray-700/50 hover:bg-gray-600/10">
                <td className="py-3 px-4 text-white">{c.name || '—'}</td>
                <td className="py-3 px-4 text-gray-300">{c.email || '—'}</td>
                <td className="py-3 px-4 text-white font-tech">{c.paymentsCount}</td>
                <td className="py-3 px-4 text-white font-tech">{formatCurrency(c.totalSpend / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-gray-300">
        <span className="text-sm">Page {currentPage} of {totalPages}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg font-tech border border-gray-700 hover:border-neon-blue/60 disabled:opacity-40"
            disabled={currentPage <= 1}
          >Prev</button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg font-tech border border-gray-700 hover:border-neon-blue/60 disabled:opacity-40"
            disabled={currentPage >= totalPages}
          >Next</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [mode, setMode] = useState<Mode>('live')
  const [preset, setPreset] = useState<string>('30d')
  const [range, setRange] = useState<{ from: number; to: number }>(() => {
    const to = Math.floor(Date.now() / 1000)
    return { from: to - 60 * 60 * 24 * 30, to }
  })
  const [overview, setOverview] = useState<OverviewMetrics | null>(null)
  const [series, setSeries] = useState<TimePoint[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStripeMetrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, range.from, range.to])

  const fetchStripeMetrics = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        throw new Error('No admin token found')
      }
      const qs = `?from=${range.from}&to=${range.to}&mode=${mode}`
      const [overviewRes, seriesRes, topRes] = await Promise.all([
        fetch(`/api/admin/metrics/overview${qs}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/admin/metrics/timeseries${qs}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/admin/metrics/top-customers${qs}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ])

      if (!overviewRes.ok) throw new Error(`Overview error: ${overviewRes.status}`)
      if (!seriesRes.ok) throw new Error(`Timeseries error: ${seriesRes.status}`)
      if (!topRes.ok) throw new Error(`Top customers error: ${topRes.status}`)

      const overviewJson = await overviewRes.json()
      const seriesJson = await seriesRes.json()
      const topJson = await topRes.json()

      setOverview(overviewJson.metrics as OverviewMetrics)
      setSeries(seriesJson.series as TimePoint[])
      setTopCustomers(topJson.topCustomers as TopCustomer[])

    } catch (err) {
      console.error('Dashboard error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const setPresetRange = (key: string) => {
    const now = Math.floor(Date.now() / 1000)
    let from = now - 60 * 60 * 24 * 30
    switch (key) {
      case 'today': from = now - 60 * 60 * 24; break
      case '7d': from = now - 60 * 60 * 24 * 7; break
      case '30d': from = now - 60 * 60 * 24 * 30; break
      case 'ytd': {
        const y = new Date()
        const start = new Date(y.getFullYear(), 0, 1)
        from = Math.floor(start.getTime() / 1000)
        break
      }
    }
    setPreset(key)
    setRange({ from, to: now })
  }

  if (!SimpleAuth.getCurrentUser()) {
  return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-tech mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to access the admin panel.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-tech mb-4">Dashboard Error</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={fetchStripeMetrics} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-gray">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-tech font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-300">
            Real-time Stripe metrics and insights
          </p>
        </div>

        {/* Quick Actions (moved to top) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <a href="/admin/fleet" className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl hover:border-neon-blue transition-colors group">
            <div className="flex items-center space-x-4">
              <Car className="w-8 h-8 text-neon-blue" />
              <div>
                <h3 className="text-lg font-tech font-bold text-white group-hover:text-neon-blue transition-colors">Manage Fleet</h3>
                <p className="text-gray-400">Add, edit, or configure vehicles</p>
              </div>
            </div>
          </a>

          <a href="/admin/bookings" className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl hover:border-neon-blue transition-colors group">
            <div className="flex items-center space-x-4">
              <Calendar className="w-8 h-8 text-neon-blue" />
              <div>
                <h3 className="text-lg font-tech font-bold text-white group-hover:text-neon-blue transition-colors">View Bookings</h3>
                <p className="text-gray-400">Manage reservations and payments</p>
              </div>
            </div>
          </a>

          <a href="/admin/invoices" className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl hover:border-neon-blue transition-colors group">
            <div className="flex items-center space-x-4">
              <DollarSign className="w-8 h-8 text-neon-blue" />
              <div>
                <h3 className="text-lg font-tech font-bold text-white group-hover:text-neon-blue transition-colors">Create Invoice</h3>
                <p className="text-gray-400">Generate custom invoices</p>
              </div>
            </div>
          </a>
        </div>

        {/* Controls: Mode + Presets + Custom Range */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="inline-flex rounded-xl overflow-hidden border border-gray-700">
            <button
              onClick={() => setMode('live')}
              className={`px-4 py-2 font-tech ${mode === 'live' ? 'bg-neon-blue text-black' : 'text-gray-300 bg-dark-metal'}`}
            >Live</button>
            <button
              onClick={() => setMode('test')}
              className={`px-4 py-2 font-tech ${mode === 'test' ? 'bg-neon-blue text-black' : 'text-gray-300 bg-dark-metal'}`}
            >Test</button>
          </div>
          <div className="flex items-center gap-2">
            {['today','7d','30d','ytd'].map((k) => (
              <button
                key={k}
                onClick={() => setPresetRange(k)}
                className={`px-3 py-1.5 rounded-lg font-tech border ${preset === k ? 'bg-neon-blue text-black border-neon-blue' : 'border-gray-700 text-gray-300 hover:border-neon-blue/60'}`}
              >{k.toUpperCase()}</button>
            ))}
          </div>
          {/* Simple custom range picker */}
          <div className="flex items-center gap-2 text-gray-300">
            <label className="text-sm">From</label>
            <input
              type="date"
              className="bg-dark-metal border border-gray-700 rounded-lg px-2 py-1 text-sm"
              value={new Date(range.from * 1000).toISOString().slice(0,10)}
              onChange={(e) => {
                const d = new Date(e.target.value + 'T00:00:00Z').getTime()
                if (!isNaN(d)) setRange((r) => ({ ...r, from: Math.floor(d/1000) }))
              }}
            />
            <label className="text-sm">To</label>
            <input
              type="date"
              className="bg-dark-metal border border-gray-700 rounded-lg px-2 py-1 text-sm"
              value={new Date(range.to * 1000).toISOString().slice(0,10)}
              onChange={(e) => {
                const d = new Date(e.target.value + 'T23:59:59Z').getTime()
                if (!isNaN(d)) setRange((r) => ({ ...r, to: Math.floor(d/1000) }))
              }}
            />
            <button
              onClick={() => fetchStripeMetrics()}
              className="px-3 py-1.5 rounded-lg font-tech border border-gray-700 text-gray-200 hover:border-neon-blue/60"
            >Apply</button>
          </div>
        </div>

        {/* KPI Cards (6 total, 3 per row) */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Gross Volume</p>
                  <p className="text-2xl font-tech font-bold text-white">{formatCurrency(overview.grossVolume / 100)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-neon-blue" />
              </div>
            </div>
            <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Payments</p>
                  <p className="text-2xl font-tech font-bold text-white">{overview.paymentsCount}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-300" />
              </div>
            </div>
            <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Failed Payments</p>
                  <p className="text-2xl font-tech font-bold text-red-400">{overview.failedPayments}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">New Customers</p>
                  <p className="text-2xl font-tech font-bold text-white">{overview.newCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-gray-300" />
              </div>
            </div>
            <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Avg Spend</p>
                  <p className="text-2xl font-tech font-bold text-white">{formatCurrency(overview.avgSpend / 100)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-300" />
              </div>
            </div>
            <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Unique Customers</p>
                  <p className="text-2xl font-tech font-bold text-white">{overview.uniquePayingCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-gray-300" />
              </div>
            </div>
          </div>
        )}

        {/* Revenue Time Series */}
        <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-tech font-bold text-white">Revenue Over Time</h2>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Spinner size={28} />
              </div>
            ) : series.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <span className="font-tech">No data for selected range</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.map((d:any) => ({ t: d.t, revenue: Math.round(d.grossVolume/100) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="t"
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    tickFormatter={(v: string) => formatDateDMY(v)}
                    interval="preserveStartEnd"
                    tickCount={Math.min(8, Math.max(3, Math.floor(series.length / 4)))}
                  />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(v) => `$${v}`}/>
                  <Tooltip
                    contentStyle={{ background: '#0b0f19', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#9CA3AF' }}
                    labelFormatter={(label: any) => formatDateDMY(String(label))}
                    formatter={(value:any) => [formatCurrency(Number(value)), 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#00e5ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Customers (sortable + paginated) */}
        <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-tech font-bold text-white">Top Customers</h2>
            <button
              onClick={() => {
                const headers = ['Customer','Email','Payments','Total Spend']
                const rows = topCustomers.map(c => [
                  (c.name || ''),
                  (c.email || ''),
                  String(c.paymentsCount),
                  (c.totalSpend / 100).toFixed(2)
                ])
                const csv = [headers, ...rows]
                  .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
                  .join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                const fromStr = formatDateDMY(new Date(range.from * 1000).toISOString())
                const toStr = formatDateDMY(new Date(range.to * 1000).toISOString())
                a.download = `dt-exotics-top-customers-${fromStr}-to-${toStr}.csv`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
              className="px-3 py-1.5 rounded-lg font-tech border border-gray-700 text-gray-200 hover:border-neon-blue/60"
            >Export CSV</button>
          </div>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <Spinner />
            </div>
          ) : topCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No customers found for selected range</p>
            </div>
          ) : (
            <TopCustomersTable topCustomers={topCustomers} />
          )}
        </div>

        
      </div>
    </div>
  )
}