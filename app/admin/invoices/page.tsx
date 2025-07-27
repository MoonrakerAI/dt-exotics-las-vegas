'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { Plus, Search, Filter, Edit3, DollarSign, Send, Trash2, FileText, ExternalLink, Calendar, AlertCircle } from 'lucide-react'
import { Invoice, InvoiceFilters } from '@/app/types/invoice'

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<InvoiceFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [filters])

  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        throw new Error('No admin token found')
      }

      const searchParams = new URLSearchParams()
      if (filters.status) searchParams.append('status', filters.status)
      if (filters.serviceType) searchParams.append('serviceType', filters.serviceType)
      if (searchTerm) searchParams.append('search', searchTerm)

      const response = await fetch(`/api/admin/invoices?${searchParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }

      const data = await response.json()
      setInvoices(data.invoices)

    } catch (err) {
      console.error('Invoice fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  // Payment links now go directly to public invoice page with Pay Now button
  // No need for separate payment link creation function

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to delete invoice')
      }

      setSuccess('Invoice deleted successfully')
      setTimeout(() => setSuccess(null), 3000)
      fetchInvoices()

    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete invoice')
    }
  }

  // Status display removed - using payment link to view invoice details

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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

  return (
    <div className="min-h-screen bg-dark-gray">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-tech font-bold text-white mb-2">
              Invoice Management
            </h1>
            <p className="text-xl text-gray-300">
              Create and manage custom invoices for VIP services, events, and more
            </p>
          </div>
          <a 
            href="/admin/invoices/create"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Invoice</span>
          </a>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchInvoices()}
                  placeholder="Search invoices..."
                  className="w-full pl-10 pr-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <button onClick={fetchInvoices} className="btn-primary">
                Search
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-600/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as Invoice['status'] || undefined }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Service Type
                  </label>
                  <select
                    value={filters.serviceType || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, serviceType: e.target.value as Invoice['serviceType'] || undefined }))}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  >
                    <option value="">All Services</option>
                    <option value="vip">VIP Experience</option>
                    <option value="bachelor_party">Bachelor Party</option>
                    <option value="corporate">Corporate Event</option>
                    <option value="custom">Custom Package</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({})}
                    className="btn-secondary w-full"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invoices Table */}
        <div className="glass-panel bg-dark-metal/50 border border-gray-600/30 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
              <p className="text-gray-400">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Invoices Found</h3>
              <p className="text-gray-400 mb-6">
                {Object.keys(filters).length > 0 || searchTerm 
                  ? 'No invoices match your current filters.' 
                  : 'Get started by creating your first invoice.'
                }
              </p>
              <a href="/admin/invoices/create" className="btn-primary">
                Create Invoice
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-metal/70">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Invoice #</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Due Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600/30">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-dark-metal/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-400">{formatDate(invoice.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{invoice.customer.name}</div>
                        <div className="text-sm text-gray-400">{invoice.customer.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{invoice.title}</div>
                        <div className="text-sm text-gray-400 capitalize">
                          {invoice.serviceType.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{formatCurrency(invoice.totalAmount)}</div>
                        {invoice.depositRequired && invoice.depositAmount && (
                          <div className="text-sm text-gray-400">
                            Deposit: {formatCurrency(invoice.depositAmount)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{formatDate(invoice.dueDate)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {invoice.status !== 'paid' && (
                            <>
                              <a
                                href={`/admin/invoices/${invoice.id}/edit`}
                                className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
                                title="Edit Invoice"
                              >
                                <Edit3 className="w-4 h-4" />
                              </a>

                              <a
                                href={`/invoice/${invoice.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                                title="Payment Link"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>

                              <button
                                onClick={() => handleDeleteInvoice(invoice)}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
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
  )
}