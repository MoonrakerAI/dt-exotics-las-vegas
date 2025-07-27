'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Invoice } from '@/app/types/invoice'
import { CreditCard, Download, Calendar, MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function PublicInvoicePage() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchInvoice()
    }
  }, [id])

  const fetchInvoice = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/invoices/${id}`)
      
      if (!response.ok) {
        throw new Error('Invoice not found')
      }

      const data = await response.json()
      setInvoice(data.invoice)
    } catch (err) {
      console.error('Invoice fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handlePayNow = async () => {
    if (!invoice) return

    setPaymentLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: invoice.totalAmount,
          invoiceId: invoice.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      const data = await response.json()
      
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (err) {
      console.error('Payment creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-tech mb-4">Invoice Not Found</h1>
          <p className="text-gray-400">{error || 'The invoice you\'re looking for doesn\'t exist.'}</p>
        </div>
      </div>
    )
  }

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid'

  return (
    <div className="min-h-screen bg-dark-gray py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-tech font-bold text-white mb-2">DT Exotics</h1>
          <p className="text-gray-400">Las Vegas Luxury Car Rentals</p>
        </div>

        {/* Invoice Card */}
        <div className="glass-panel bg-white text-black rounded-2xl shadow-2xl overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-black to-gray-900 text-white p-8">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-6">
                <div className="bg-black p-4 rounded-lg">
                  <img 
                    src="/images/dt-exotics-logo.svg" 
                    alt="DT Exotics" 
                    className="h-12 w-auto"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-tech font-bold mb-2">INVOICE</h2>
                  <p className="text-gray-300">#{invoice.invoiceNumber}</p>
                  <p className="text-gray-300">Issued: {formatDate(invoice.issueDate)}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}>
                  {invoice.status.toUpperCase()}
                </div>
                {isOverdue && (
                  <div className="mt-2 flex items-center text-red-400 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    Overdue
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8">
            {/* Customer & Service Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Bill To:</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="font-medium text-black">{invoice.customer.name}</p>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{invoice.customer.email}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Service Details:</h3>
                <div className="space-y-2 text-gray-700">
                  <p className="font-medium text-black">{invoice.title}</p>
                  <p className="capitalize">{invoice.serviceType.replace('_', ' ')}</p>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Due: {formatDate(invoice.dueDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {invoice.description && (
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-black mb-2">Description:</h4>
                <p className="text-gray-700">{invoice.description}</p>
              </div>
            )}

            {/* Line Items */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-black mb-4">Services & Items:</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 text-black font-semibold">Description</th>
                      <th className="text-center py-3 text-black font-semibold">Qty</th>
                      <th className="text-right py-3 text-black font-semibold">Unit Price</th>
                      <th className="text-right py-3 text-black font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-3 text-gray-700">{item.description}</td>
                        <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right text-gray-700 font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="text-gray-700">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.discountAmount && invoice.discountAmount > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-700">Discount:</span>
                      <span className="text-green-600">-{formatCurrency(invoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Tax ({invoice.taxRate}%):</span>
                    <span className="text-gray-700">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-300">
                    <span className="text-xl font-bold text-black">Total:</span>
                    <span className="text-xl font-bold text-black">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Actions */}
            {invoice.status !== 'paid' && (
              <div className="border-t border-gray-300 pt-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-black mb-4">Ready to Pay?</h4>
                  <button
                    onClick={handlePayNow}
                    disabled={paymentLoading}
                    className="bg-neon-blue text-black font-tech font-semibold uppercase tracking-wider px-12 py-6 rounded-lg transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.8)] hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center space-x-3 mx-auto text-lg"
                  >
                    {paymentLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Pay Now - {formatCurrency(invoice.totalAmount)}</span>
                      </>
                    )}
                  </button>
                  <p className="text-gray-600 text-sm mt-3">Secure payment powered by Stripe</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-black mb-2">Notes:</h4>
                <p className="text-gray-700 text-sm">{invoice.notes}</p>
              </div>
            )}

            {/* Terms */}
            {invoice.terms && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-black mb-2">Terms & Conditions:</h4>
                <p className="text-gray-700 text-sm">{invoice.terms}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-black to-gray-900 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-black p-2 rounded">
                  <img 
                    src="/images/dt-exotics-logo.svg" 
                    alt="DT Exotics" 
                    className="h-8 w-auto"
                  />
                </div>
                <div className="text-white">
                  <p className="font-tech font-semibold">DT Exotics</p>
                  <p className="text-gray-300 text-sm">Las Vegas Luxury Car Rentals</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-300 text-sm">
                  Questions about this invoice?
                </p>
                <a href="mailto:billing@dtexoticslv.com" className="text-neon-blue hover:underline text-sm">
                  billing@dtexoticslv.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}