'use client'

import { useState } from 'react'
import { RentalBooking } from '@/app/types/rental'
import { X, FileText, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface RentalAgreementModalProps {
  booking: RentalBooking
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RentalAgreementModal({ 
  booking, 
  isOpen, 
  onClose, 
  onSuccess 
}: RentalAgreementModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [expirationDays, setExpirationDays] = useState(7)
  const [recipientsText, setRecipientsText] = useState<string>(booking.customer.email || '')

  const parseRecipientEmails = (input: string): string[] => {
    const parts = input
      .split(/[\s,;]+/)
      .map(s => s.trim())
      .filter(Boolean)
    // Deduplicate and simple validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const unique = Array.from(new Set(parts))
    return unique.filter(e => emailRegex.test(e))
  }

  if (!isOpen) return null

  const handleSendAgreement = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const recipientEmails = parseRecipientEmails(recipientsText)
      if (recipientEmails.length === 0) {
        throw new Error('Please provide at least one valid recipient email')
      }

      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        throw new Error('No admin token found')
      }

      const response = await fetch('/api/admin/rental-agreements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: booking.id,
          expirationDays,
          customMessage: customMessage.trim() || undefined,
          recipientEmails
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send rental agreement')
      }

      setSuccess('Rental agreement sent successfully!')
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (err) {
      console.error('Error sending rental agreement:', err)
      setError(err instanceof Error ? err.message : 'Failed to send rental agreement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-gray rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-neon-blue" />
            <h2 className="text-xl font-tech font-bold text-white">
              Send Rental Agreement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Booking Info */}
          <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-300">
                  <span className="font-medium">Customer:</span> {booking.customer.firstName} {booking.customer.lastName}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Email:</span> {booking.customer.email}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Phone:</span> {booking.customer.phone}
                </p>
              </div>
              <div>
                <p className="text-gray-300">
                  <span className="font-medium">Vehicle:</span> {booking.car.year} {booking.car.brand} {booking.car.model}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Dates:</span> {new Date(booking.rentalDates.startDate).toLocaleDateString()} - {new Date(booking.rentalDates.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-300">
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                    booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    booking.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    booking.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Agreement Settings */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Agreement Expiration
              </label>
              <select
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
              >
                <option value={3}>3 days</option>
                <option value={7}>7 days (recommended)</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Customer must complete the agreement within this timeframe
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Emails
              </label>
              <input
                type="text"
                value={recipientsText}
                onChange={(e) => setRecipientsText(e.target.value)}
                placeholder="Enter one or more emails, separated by commas"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Defaults to customer email. Supports multiple addresses separated by commas or spaces.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add any special instructions or notes for the customer..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">
                {customMessage.length}/500 characters
              </p>
            </div>
          </div>

          {/* Agreement Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-6">
            <h4 className="text-blue-400 font-medium mb-2">📋 What's Included in the Agreement</h4>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Personal information and emergency contact</li>
              <li>• Driver's license verification</li>
              <li>• Insurance and liability acknowledgment</li>
              <li>• Vehicle condition acceptance</li>
              <li>• Rental terms and conditions</li>
              <li>• Digital signature</li>
            </ul>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg mb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendAgreement}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-neon-blue text-black font-medium rounded-lg hover:bg-neon-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Agreement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
