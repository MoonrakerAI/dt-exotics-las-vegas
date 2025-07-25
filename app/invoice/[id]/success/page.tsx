'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CheckCircle, Download, ArrowLeft } from 'lucide-react'

export default function PaymentSuccessPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<any>(null)

  useEffect(() => {
    if (sessionId && id) {
      // Optional: Verify the payment was successful
      fetchInvoice()
    }
  }, [sessionId, id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data.invoice)
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-dark-gray py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Card */}
        <div className="glass-panel bg-white text-black rounded-2xl shadow-2xl overflow-hidden text-center p-8">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-tech font-bold text-black mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Thank you for your payment. Your transaction has been completed.</p>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-black mb-4">Payment Details</h3>
            <div className="space-y-2 text-left">
              {invoice && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice:</span>
                    <span className="font-medium text-black">#{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium text-black">{invoice.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-black">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Date:</span>
                <span className="font-medium text-black">{new Date().toLocaleDateString()}</span>
              </div>
              {sessionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-xs text-gray-500">{sessionId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`/invoice/${id}`}
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                View Invoice
              </a>
              
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center px-6 py-3 bg-neon-blue text-black rounded-lg hover:bg-blue-500 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Print Receipt
              </button>
            </div>

            <div className="text-center text-gray-600 text-sm">
              <p>A receipt has been sent to your email address.</p>
              <p className="mt-2">
                Questions? Contact us at{' '}
                <a href="mailto:billing@dtexoticslv.com" className="text-neon-blue hover:underline">
                  billing@dtexoticslv.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="text-center mt-8">
          <h2 className="text-2xl font-tech font-bold text-white mb-2">DT Exotics</h2>
          <p className="text-gray-400">Las Vegas Luxury Car Rentals</p>
          <p className="text-gray-500 text-sm mt-2">Thank you for choosing DT Exotics for your luxury experience!</p>
        </div>
      </div>
    </div>
  )
}