'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleAuth } from '../../../lib/simple-auth'
import { Plus, Trash2, Eye, Save, ArrowLeft, AlertCircle, DollarSign } from 'lucide-react'
import { CreateInvoiceRequest, InvoiceLineItem } from '@/app/types/invoice'

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

export default function CreateInvoice() {
  const router = useRouter()
  const [loading, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

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
    terms: 'Payment is due within 30 days of invoice date.'
  })

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

  const handleSave = async (status: 'draft' | 'sent' = 'draft') => {
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

      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      const data = await response.json()
      
      if (status === 'sent') {
        // Update status to sent
        await fetch(`/api/admin/invoices/${data.invoice.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'sent' })
        })
      }

      setSuccess(`Invoice ${status === 'draft' ? 'saved as draft' : 'created and sent'} successfully!`)
      
      // Redirect to invoice view after a short delay
      setTimeout(() => {
        router.push(`/admin/invoices/${data.invoice.id}`)
      }, 2000)

    } catch (err) {
      console.error('Invoice creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-tech font-bold text-white mb-2">
                Create Invoice
              </h1>
              <p className="text-xl text-gray-300">
                Build a custom invoice for VIP services, events, and more
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
          </div>
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

        <div className="space-y-8">
          {/* Main Form */}
          <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 rounded-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Customer & Invoice Info */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-tech font-bold text-white mb-6">Invoice Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customer.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customer: { ...prev.customer, name: e.target.value }
                      }))}
                      className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      placeholder="Customer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.customer.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customer: { ...prev.customer, email: e.target.value }
                      }))}
                      className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      placeholder="customer@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Invoice Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      placeholder="VIP Experience Package"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Service Type
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceType: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    >
                      <option value="vip">VIP Experience</option>
                      <option value="bachelor_party">Bachelor Party</option>
                      <option value="corporate">Corporate Event</option>
                      <option value="custom">Custom Package</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      step="0.001"
                      min="0"
                      max="100"
                      className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-tech font-semibold text-white">Summary</h3>
                <div className="bg-dark-metal/30 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white">{formatCurrency(subtotal)}</span>
                  </div>
                  {(formData.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Discount:</span>
                      <span className="text-green-400">-{formatCurrency(formData.discountAmount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tax ({formData.taxRate}%):</span>
                    <span className="text-white">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-600 pt-2">
                    <span className="text-white">Total:</span>
                    <span className="text-neon-blue">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-tech font-bold text-white">Services & Items</h2>
              <button
                onClick={addLineItem}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

              <div className="space-y-4">
                {formData.lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                        placeholder="Service description"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Qty
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      />
                    </div>

                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1">
                      {formData.lineItems.length > 1 && (
                        <button
                          onClick={() => removeLineItem(index)}
                          className="p-3 text-red-400 hover:text-red-300 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          {/* Additional Options */}
          <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
            <h2 className="text-2xl font-tech font-bold text-white mb-6">Additional Options</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Discount Amount (Optional)
                </label>
                <input
                  type="number"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none resize-none"
                  placeholder="Additional notes for the customer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleSave('draft')}
              disabled={loading}
              className="btn-secondary disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save as Draft</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleSave('sent')}
              disabled={loading}
              className="btn-primary disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>Create & Send Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="xl:sticky xl:top-8">
            <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
                <h2 className="text-2xl font-tech font-bold text-white mb-6">Invoice Preview</h2>
                
                <div className="bg-white text-black p-8 rounded-lg">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h1 className="text-3xl font-bold text-black mb-2">DT Exotics</h1>
                      <p className="text-gray-600">Las Vegas, Nevada</p>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold text-black mb-2">INVOICE</h2>
                      <p className="text-gray-600">Invoice #: [Auto-Generated]</p>
                      <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-black mb-2">Bill To:</h3>
                    <div className="text-gray-700">
                      <p className="font-medium">{formData.customer.name || 'Customer Name'}</p>
                      <p>{formData.customer.email || 'customer@email.com'}</p>
                      {formData.customer.phone && <p>{formData.customer.phone}</p>}
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-black mb-2">{formData.title || 'Invoice Title'}</h3>
                    {formData.description && (
                      <p className="text-gray-700 mb-4">{formData.description}</p>
                    )}
                    <p className="text-sm text-gray-600">Due Date: {formData.dueDate || 'Not set'}</p>
                  </div>

                  {/* Line Items */}
                  <div className="mb-8">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-300">
                          <th className="text-left py-2 text-black">Description</th>
                          <th className="text-center py-2 text-black">Qty</th>
                          <th className="text-right py-2 text-black">Unit Price</th>
                          <th className="text-right py-2 text-black">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.lineItems.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="py-2 text-gray-700">{item.description || 'Service description'}</td>
                            <td className="py-2 text-center text-gray-700">{item.quantity}</td>
                            <td className="py-2 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2 text-right text-gray-700">{formatCurrency(item.quantity * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end mb-8">
                    <div className="w-64">
                      <div className="flex justify-between py-1">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="text-gray-700">{formatCurrency(subtotal)}</span>
                      </div>
                      {(formData.discountAmount || 0) > 0 && (
                        <div className="flex justify-between py-1">
                          <span className="text-gray-700">Discount:</span>
                          <span className="text-gray-700">-{formatCurrency(formData.discountAmount || 0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-gray-700">Tax ({formData.taxRate}%):</span>
                        <span className="text-gray-700">{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-gray-300 font-bold">
                        <span className="text-black">Total:</span>
                        <span className="text-black">{formatCurrency(totalAmount)}</span>
                      </div>
                      {formData.depositRequired && formData.depositAmount && (
                        <div className="flex justify-between py-1 text-sm">
                          <span className="text-gray-600">Deposit Required:</span>
                          <span className="text-gray-600">{formatCurrency(formData.depositAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes and Terms */}
                  {(formData.notes || formData.terms) && (
                    <div className="border-t border-gray-300 pt-6">
                      {formData.notes && (
                        <div className="mb-4">
                          <h4 className="font-semibold text-black mb-2">Notes:</h4>
                          <p className="text-gray-700 text-sm">{formData.notes}</p>
                        </div>
                      )}
                      {formData.terms && (
                        <div>
                          <h4 className="font-semibold text-black mb-2">Terms & Conditions:</h4>
                          <p className="text-gray-700 text-sm">{formData.terms}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}