'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SimpleAuth } from '../../../../lib/simple-auth'
import { Plus, Trash2, Eye, Save, ArrowLeft, AlertCircle, DollarSign } from 'lucide-react'
import { Invoice, CreateInvoiceRequest, InvoiceLineItem } from '@/app/types/invoice'

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

export default function EditInvoice() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateInvoiceRequest>({
    customer: {
      name: '',
      email: '',
      phone: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        zipCode: ''
      }
    },
    title: '',
    description: '',
    serviceType: 'custom',
    lineItems: [
      { description: '', quantity: 1, unitPrice: 0 }
    ],
    taxRate: 8.375, // Nevada sales tax
    discountAmount: 0,
    depositRequired: false,
    depositAmount: 0,
    dueDate: '',
    notes: '',
    terms: 'Payment is due within 7 business days of invoice date.'
  })

  // Load existing invoice data
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const token = localStorage.getItem('dt-admin-token')
        if (!token) {
          router.push('/admin/login')
          return
        }

        const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError('Invoice not found')
          } else {
            throw new Error('Failed to load invoice')
          }
          return
        }

        const invoice = await response.json()
        setOriginalInvoice(invoice)

        // Check if invoice can be edited
        if (invoice.status === 'paid') {
          setError('This invoice cannot be edited because it has been marked as paid.')
          return
        }

        // Populate form with existing data
        setFormData({
          customer: invoice.customer,
          title: invoice.title,
          description: invoice.description || '',
          serviceType: invoice.serviceType || 'custom',
          lineItems: invoice.lineItems,
          taxRate: invoice.taxRate,
          discountAmount: invoice.discountAmount || 0,
          depositRequired: invoice.depositRequired || false,
          depositAmount: invoice.depositAmount || 0,
          dueDate: invoice.dueDate.split('T')[0], // Convert to YYYY-MM-DD format
          notes: invoice.notes || '',
          terms: invoice.terms || 'Payment is due within 7 business days of invoice date.'
        })

      } catch (err) {
        console.error('Error loading invoice:', err)
        setError(err instanceof Error ? err.message : 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId, router])

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', quantity: 1, unitPrice: 0 }]
    }))
  }

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const discountedSubtotal = subtotal - (formData.discountAmount || 0)
    const taxAmount = discountedSubtotal * (formData.taxRate / 100)
    const totalAmount = discountedSubtotal + taxAmount
    
    return { subtotal, taxAmount, totalAmount: Math.max(0, totalAmount) }
  }

  const { subtotal, taxAmount, totalAmount } = calculateTotals()

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    // Validation
    if (!formData.customer.name || !formData.customer.email) {
      setError('Customer name and email are required')
      return
    }

    if (!formData.title) {
      setError('Invoice title is required')
      return
    }

    if (formData.lineItems.length === 0 || formData.lineItems.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Please add at least one valid line item')
      return
    }

    if (!formData.dueDate) {
      setError('Due date is required')
      return
    }

    if (formData.depositRequired && (!formData.depositAmount || formData.depositAmount <= 0)) {
      setError('Deposit amount is required when deposit is enabled')
      return
    }

    if (formData.depositRequired && formData.depositAmount && formData.depositAmount > totalAmount) {
      setError('Deposit amount cannot exceed total amount')
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        throw new Error('No admin token found')
      }

      const response = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update invoice')
      }

      setSuccess('Invoice updated successfully!')
      setTimeout(() => {
        router.push('/admin/invoices')
      }, 1500)

    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
            <span className="ml-3 text-white">Loading invoice...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error && !originalInvoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-red-400 font-semibold">Error Loading Invoice</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/invoices')}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/invoices')}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-tech font-bold text-white">Edit Invoice</h1>
              {originalInvoice && (
                <p className="text-gray-400">
                  #{originalInvoice.invoiceNumber} • Status: 
                  <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                    originalInvoice.status === 'draft' ? 'bg-gray-500/20 text-gray-300' :
                    originalInvoice.status === 'ready' ? 'bg-yellow-500/20 text-yellow-300' :
                    originalInvoice.status === 'sent' ? 'bg-blue-500/20 text-blue-300' :
                    originalInvoice.status === 'paid' ? 'bg-green-500/20 text-green-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {originalInvoice.status.charAt(0).toUpperCase() + originalInvoice.status.slice(1)}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (originalInvoice?.status === 'paid')}
              className="flex items-center space-x-2 bg-neon-blue text-black font-tech font-semibold px-6 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-dark-metal rounded-xl p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-bold text-white mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={formData.customer.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none"
                    placeholder="Enter customer name"
                    disabled={originalInvoice?.status === 'paid'}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={formData.customer.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none"
                    placeholder="customer@example.com"
                    disabled={originalInvoice?.status === 'paid'}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, phone: e.target.value } }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none"
                    placeholder="(555) 123-4567"
                    disabled={originalInvoice?.status === 'paid'}
                  />
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="bg-dark-metal rounded-xl p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-bold text-white mb-4">Invoice Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Invoice Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none"
                    placeholder="e.g., Luxury Car Rental Service"
                    disabled={originalInvoice?.status === 'paid'}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none resize-none"
                    placeholder="Brief description of services provided..."
                    disabled={originalInvoice?.status === 'paid'}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Service Type</label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value as any }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-neon-blue focus:outline-none"
                      disabled={originalInvoice?.status === 'paid'}
                    >
                      <option value="rental">Car Rental</option>
                      <option value="event">Event Service</option>
                      <option value="tour">Tour Package</option>
                      <option value="custom">Custom Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Due Date *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-neon-blue focus:outline-none"
                      disabled={originalInvoice?.status === 'paid'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-dark-metal rounded-xl p-6 border border-gray-600/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-tech font-bold text-white">Line Items</h2>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center space-x-2 px-3 py-1 bg-neon-blue/20 text-neon-blue rounded-lg hover:bg-neon-blue/30 transition-colors text-sm"
                  disabled={originalInvoice?.status === 'paid'}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <label className="block text-gray-300 text-xs font-medium mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm placeholder-gray-400 focus:border-neon-blue focus:outline-none"
                        placeholder="Service description"
                        disabled={originalInvoice?.status === 'paid'}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-300 text-xs font-medium mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-neon-blue focus:outline-none"
                        min="1"
                        disabled={originalInvoice?.status === 'paid'}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-gray-300 text-xs font-medium mb-1">Unit Price</label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-neon-blue focus:outline-none"
                        min="0"
                        step="0.01"
                        disabled={originalInvoice?.status === 'paid'}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <span className="text-white text-sm font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                      {formData.lineItems.length > 1 && originalInvoice?.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing & Terms */}
            <div className="bg-dark-metal rounded-xl p-6 border border-gray-600/30">
              <h2 className="text-xl font-tech font-bold text-white mb-4">Pricing & Terms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-neon-blue focus:outline-none"
                    min="0"
                    max="100"
                    step="0.001"
                    disabled={originalInvoice?.status === 'paid'}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Discount Amount</label>
                  <input
                    type="number"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-neon-blue focus:outline-none"
                    min="0"
                    step="0.01"
                    disabled={originalInvoice?.status === 'paid'}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.depositRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, depositRequired: e.target.checked }))}
                    className="rounded border-gray-600 bg-gray-800 text-neon-blue focus:ring-neon-blue focus:ring-offset-0"
                    disabled={originalInvoice?.status === 'paid'}
                  />
                  <span className="text-gray-300">Require deposit</span>
                </label>
                {formData.depositRequired && (
                  <div className="mt-2">
                    <input
                      type="number"
                      value={formData.depositAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-neon-blue focus:outline-none"
                      placeholder="Deposit amount"
                      min="0"
                      step="0.01"
                      disabled={originalInvoice?.status === 'paid'}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none resize-none"
                    placeholder="Additional notes or special instructions..."
                    disabled={originalInvoice?.status === 'paid'}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Terms & Conditions</label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none resize-none"
                    placeholder="Payment terms and conditions..."
                    disabled={originalInvoice?.status === 'paid'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="space-y-6">
            {/* Totals */}
            <div className="bg-dark-metal rounded-xl p-6 border border-gray-600/30 sticky top-6">
              <h2 className="text-xl font-tech font-bold text-white mb-4">Invoice Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {(formData.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>Discount:</span>
                    <span>-{formatCurrency(formData.discountAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300">
                  <span>Tax ({formData.taxRate}%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-neon-blue">{formatCurrency(totalAmount)}</span>
                  </div>
                  {formData.depositRequired && formData.depositAmount && (
                    <div className="flex justify-between text-gray-300 text-sm mt-2">
                      <span>Deposit Required:</span>
                      <span>{formatCurrency(formData.depositAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
