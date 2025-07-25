'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomInvoice } from '../../types/rental'
import { formatCurrency } from '../../lib/rental-utils'
import { 
  Receipt, 
  CreditCard, 
  Clock, 
  CheckCircle,
  Building,
  Mail,
  Phone,
  Calendar
} from 'lucide-react'

interface PayInvoicePageProps {
  params: { invoiceId: string }
}

export default function PayInvoicePage({ params }: PayInvoicePageProps) {
  const [invoice, setInvoice] = useState<CustomInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchInvoice()
  }, [params.invoiceId])

  const fetchInvoice = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/invoices/${params.invoiceId}`)
      
      if (response.ok) {
        const data = await response.json()
        setInvoice(data.invoice)
      } else if (response.status === 404) {
        setError('Invoice not found')
      } else {
        setError('Failed to load invoice')
      }
    } catch (err) {
      setError('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!invoice) return

    setPaying(true)
    try {
      const response = await fetch(`/api/invoices/${params.invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        if (data.clientSecret) {
          // Redirect to Stripe payment
          window.location.href = data.paymentUrl
        } else {
          // Payment successful
          router.push(`/pay-invoice/${params.invoiceId}/success`)
        }
      } else {
        setError(data.error || 'Payment failed')
      }
    } catch (err) {
      setError('Payment failed')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-gray via-dark-metal to-dark-gray flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
          <p className="text-gray-300 mt-4">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-gray via-dark-metal to-dark-gray flex items-center justify-center">
        <div className="glass-panel bg-dark-metal/30 p-8 border border-red-500/30 rounded-2xl backdrop-blur-sm text-center max-w-md">
          <Receipt className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-tech font-bold text-white mb-4">Error</h1>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-gray via-dark-metal to-dark-gray flex items-center justify-center">
        <div className="glass-panel bg-dark-metal/30 p-8 border border-gray-600/30 rounded-2xl backdrop-blur-sm text-center max-w-md">
          <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-tech font-bold text-white mb-4">Invoice Not Found</h1>
          <p className="text-gray-300">The requested invoice could not be found.</p>
        </div>
      </div>
    )
  }

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid'
  const isPaid = invoice.status === 'paid'

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-gray via-dark-metal to-dark-gray py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/images/logo/DT Exotics Logo Icon.png"
              alt="DT Exotics"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-4xl font-tech font-bold text-white mb-2">
            DT Exotics Las Vegas
          </h1>
          <p className="text-xl text-gray-300">Invoice Payment</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Invoice Details */}
          <div className="lg:col-span-2">
            <div className="glass-panel bg-dark-metal/30 p-8 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
              {/* Invoice Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-tech font-bold text-white mb-2">
                    Invoice {invoice.invoiceNumber}
                  </h2>
                  <p className="text-gray-400">
                    Created: {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {isPaid ? (
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">PAID</span>
                    </div>
                  ) : isOverdue ? (
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">OVERDUE</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">PENDING</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill To */}
              <div className="mb-8">
                <h3 className="text-lg font-tech font-semibold text-white mb-4">Bill To:</h3>
                <div className="bg-dark-metal/20 p-4 rounded-lg">
                  <p className="text-white font-medium mb-2">{invoice.customerDetails.name}</p>
                  <div className="flex items-center text-gray-400 mb-1">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{invoice.customerDetails.email}</span>
                  </div>
                  {invoice.customerDetails.phone && (
                    <div className="flex items-center text-gray-400 mb-1">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{invoice.customerDetails.phone}</span>
                    </div>
                  )}
                  {invoice.customerDetails.address && (
                    <div className="flex items-start text-gray-400">
                      <Building className="w-4 h-4 mr-2 mt-0.5" />
                      <span>{invoice.customerDetails.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div className="mb-8">
                <h3 className="text-lg font-tech font-semibold text-white mb-4">Items:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-600/30">
                      <tr>
                        <th className="text-left py-3 text-sm font-medium text-gray-300">Description</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-300">Qty</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-300">Price</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-300">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600/30">
                      {invoice.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 text-white">{item.description}</td>
                          <td className="py-3 text-gray-300 text-right">{item.quantity}</td>
                          <td className="py-3 text-gray-300 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 text-white text-right font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-600/30 pt-6">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Subtotal:</span>
                      <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.tax && invoice.tax > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Tax ({invoice.taxRate}%):</span>
                        <span className="text-white">{formatCurrency(invoice.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-600/30">
                      <span className="text-white font-semibold text-lg">Total:</span>
                      <span className="text-neon-blue font-tech font-bold text-2xl">
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mt-8 pt-6 border-t border-gray-600/30">
                  <h3 className="text-lg font-tech font-semibold text-white mb-2">Notes:</h3>
                  <p className="text-gray-300">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Panel */}
          <div className="lg:col-span-1">
            <div className="glass-panel bg-dark-metal/30 p-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm sticky top-8">
              <h3 className="text-xl font-tech font-bold text-white mb-6">Payment Details</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Amount Due:</span>
                  <span className="text-neon-blue font-tech font-bold text-xl">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Due Date:</span>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className={`text-sm ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {isOverdue && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-300 text-sm font-medium">
                      This invoice is overdue. Please pay as soon as possible.
                    </p>
                  </div>
                )}
              </div>

              {isPaid ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-300 font-medium">Payment Completed</p>
                  <p className="text-green-400 text-sm mt-1">
                    Paid on {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{paying ? 'Processing...' : 'Pay Now'}</span>
                </button>
              )}

              <div className="mt-6 pt-6 border-t border-gray-600/30">
                <p className="text-gray-400 text-sm text-center">
                  Secure payment powered by Stripe
                </p>
                <div className="flex items-center justify-center mt-2 space-x-2">
                  <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                    VISA
                  </div>
                  <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                    MC
                  </div>
                  <div className="w-8 h-5 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">
                    AMEX
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}