'use client'

import { useState, useEffect } from 'react'
import { Invoice } from '@/app/types/invoice'
import { X, Plus, Trash2, Mail, Send } from 'lucide-react'

interface EmailInvoiceModalProps {
  invoice: Invoice | null
  isOpen: boolean
  onClose: () => void
  onSend: (recipients: string[], customMessage?: string) => Promise<void>
}

export default function EmailInvoiceModal({ 
  invoice, 
  isOpen, 
  onClose, 
  onSend 
}: EmailInvoiceModalProps) {
  const [recipients, setRecipients] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize recipients when modal opens
  useEffect(() => {
    if (invoice && isOpen) {
      setRecipients([invoice.customer.email])
      setCustomMessage('')
      setError(null)
    }
  }, [invoice, isOpen])

  const addRecipient = () => {
    setRecipients([...recipients, ''])
  }

  const updateRecipient = (index: number, email: string) => {
    const updated = [...recipients]
    updated[index] = email
    setRecipients(updated)
  }

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index))
    }
  }

  const validateEmails = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails = recipients.filter(email => email.trim() && emailRegex.test(email.trim()))
    
    if (validEmails.length === 0) {
      setError('Please enter at least one valid email address')
      return false
    }

    const invalidEmails = recipients.filter(email => email.trim() && !emailRegex.test(email.trim()))
    if (invalidEmails.length > 0) {
      setError('Please check all email addresses are valid')
      return false
    }

    return true
  }

  const handleSend = async () => {
    setError(null)
    
    if (!validateEmails()) {
      return
    }

    setSending(true)
    try {
      const validEmails = recipients.filter(email => email.trim()).map(email => email.trim())
      await onSend(validEmails, customMessage.trim() || undefined)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen || !invoice) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-metal rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-black to-gray-900 p-6 border-b border-gray-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-6 h-6 text-neon-blue" />
              <div>
                <h2 className="text-xl font-tech font-bold text-white">Email Invoice</h2>
                <p className="text-gray-400 text-sm">Invoice #{invoice.invoiceNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Invoice Summary */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
            <h3 className="text-white font-semibold mb-2">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Customer:</span>
                <p className="text-white">{invoice.customer.name}</p>
              </div>
              <div>
                <span className="text-gray-400">Amount:</span>
                <p className="text-white">${invoice.totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-400">Service:</span>
                <p className="text-white">{invoice.title}</p>
              </div>
              <div>
                <span className="text-gray-400">Due Date:</span>
                <p className="text-white">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-white font-semibold">Email Recipients</label>
              <button
                onClick={addRecipient}
                className="flex items-center space-x-2 px-3 py-1 bg-neon-blue/20 text-neon-blue rounded-lg hover:bg-neon-blue/30 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Recipient</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {recipients.map((email, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none"
                  />
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(index)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="text-white font-semibold mb-3 block">Custom Message (Optional)</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to include with the invoice..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none resize-none"
            />
            <p className="text-gray-400 text-xs mt-1">This message will be included at the top of the email</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800/50 p-6 border-t border-gray-600/30">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Invoice will be sent with a secure payment link
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center space-x-2 bg-neon-blue text-black font-tech font-semibold px-6 py-2 rounded-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
