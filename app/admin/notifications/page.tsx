'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { Save, Mail, Bell, Send, CheckCircle, AlertTriangle } from 'lucide-react'

export default function NotificationsAdmin() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    bookingAlerts: true,
    paymentAlerts: true,
    systemAlerts: true,
    adminEmails: ['admin@dtexoticslv.com'],
    adminEmail: 'admin@dtexoticslv.com' // Backward compatibility
  })

  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<{[key: string]: 'success' | 'error' | null}>({})
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('dt-admin-token')
      
      // Load notification settings only
      const notificationResponse = await fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json()
        setSettings(notificationData.settings)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('dt-admin-token')
      
      // Save notification settings
      const notificationResponse = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      })
      
      if (notificationResponse.ok) {
        alert('Notification settings saved successfully!')
      } else {
        throw new Error('Failed to save notification settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save notification settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const sendTestEmail = async (type: string) => {
    setSendingTest(type)
    setTestResults(prev => ({ ...prev, [type]: null }))
    
    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      })
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, [type]: 'success' }))
      } else {
        throw new Error('Failed to send test email')
      }
    } catch (error) {
      console.error('Test email error:', error)
      setTestResults(prev => ({ ...prev, [type]: 'error' }))
    } finally {
      setSendingTest(null)
    }
  }

  // Helper functions for managing admin emails
  const addAdminEmail = () => {
    if (newEmail && isValidEmail(newEmail) && !settings.adminEmails.includes(newEmail)) {
      setSettings(prev => ({
        ...prev,
        adminEmails: [...prev.adminEmails, newEmail]
      }))
      setNewEmail('')
    }
  }

  const removeAdminEmail = (emailToRemove: string) => {
    if (settings.adminEmails.length > 1) { // Keep at least one admin email
      setSettings(prev => ({
        ...prev,
        adminEmails: prev.adminEmails.filter(email => email !== emailToRemove)
      }))
    }
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-charcoal text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-charcoal text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-tech font-bold text-white mb-2 flex items-center">
                <Bell className="w-8 h-8 mr-3 text-neon-blue" />
                Notification Settings
              </h1>
              <p className="text-gray-400">
                Configure email notifications and test your notification setup
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 bg-neon-blue text-black px-6 py-3 rounded-lg font-semibold hover:bg-neon-blue/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-dark-metal/50 rounded-xl border border-gray-600/30 p-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-neon-blue" />
            Email Notification Preferences
          </h2>

          {/* Admin Emails */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Admin Email Addresses
            </label>
            
            {/* Current Admin Emails */}
            <div className="space-y-3 mb-4">
              {settings.adminEmails.map((email, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-gray/50 rounded-lg border border-gray-600/30">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-neon-blue" />
                    <span className="text-white">{email}</span>
                  </div>
                  {settings.adminEmails.length > 1 && (
                    <button
                      onClick={() => removeAdminEmail(email)}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Remove email"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Add New Email */}
            <div className="flex space-x-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAdminEmail()}
                className="flex-1 px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none"
                placeholder="Enter new admin email..."
              />
              <button
                onClick={addAdminEmail}
                disabled={!newEmail || !isValidEmail(newEmail) || settings.adminEmails.includes(newEmail)}
                className="px-6 py-3 bg-neon-blue text-dark-gray font-medium rounded-lg hover:bg-neon-blue/80 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mt-3">
              All listed emails will receive admin notifications. You must have at least one admin email.
            </p>
          </div>

          {/* Notification Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <label className="flex items-center justify-between p-4 bg-dark-gray/50 rounded-lg border border-gray-600/30 hover:border-neon-blue/50 transition-colors cursor-pointer">
              <div>
                <span className="text-white font-medium">Email Notifications</span>
                <p className="text-gray-400 text-sm">Enable all email notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="w-5 h-5 text-neon-blue bg-dark-gray border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-dark-gray/50 rounded-lg border border-gray-600/30 hover:border-neon-blue/50 transition-colors cursor-pointer">
              <div>
                <span className="text-white font-medium">Booking Alerts</span>
                <p className="text-gray-400 text-sm">New bookings and cancellations</p>
              </div>
              <input
                type="checkbox"
                checked={settings.bookingAlerts}
                onChange={(e) => setSettings(prev => ({ ...prev, bookingAlerts: e.target.checked }))}
                className="w-5 h-5 text-neon-blue bg-dark-gray border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-dark-gray/50 rounded-lg border border-gray-600/30 hover:border-neon-blue/50 transition-colors cursor-pointer">
              <div>
                <span className="text-white font-medium">Payment Alerts</span>
                <p className="text-gray-400 text-sm">Payment successes and failures</p>
              </div>
              <input
                type="checkbox"
                checked={settings.paymentAlerts}
                onChange={(e) => setSettings(prev => ({ ...prev, paymentAlerts: e.target.checked }))}
                className="w-5 h-5 text-neon-blue bg-dark-gray border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-dark-gray/50 rounded-lg border border-gray-600/30 hover:border-neon-blue/50 transition-colors cursor-pointer">
              <div>
                <span className="text-white font-medium">System Alerts</span>
                <p className="text-gray-400 text-sm">System errors and warnings</p>
              </div>
              <input
                type="checkbox"
                checked={settings.systemAlerts}
                onChange={(e) => setSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                className="w-5 h-5 text-neon-blue bg-dark-gray border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
              />
            </label>
          </div>

          {/* Test Email Section */}
          <div className="bg-dark-metal/30 p-6 rounded-lg border border-gray-600/30">
            <h4 className="text-lg font-medium text-white mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-neon-blue" />
              Test Email Notifications
            </h4>
            <p className="text-gray-400 mb-6">Send test emails to verify your notification setup is working correctly.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { type: 'booking', label: 'New Booking', icon: '🚗' },
                { type: 'payment_success', label: 'Payment Success', icon: '✅' },
                { type: 'payment_failed', label: 'Payment Failed', icon: '❌' },
                { type: 'system', label: 'System Alert', icon: '⚠️' },
                { type: 'customer_booking', label: 'Customer Booking', icon: '📧' },
                { type: 'customer_payment_success', label: 'Customer Payment Success', icon: '💳' },
                { type: 'customer_payment_failed', label: 'Customer Payment Failed', icon: '⚠️' },
                { type: 'customer_reminder', label: 'Customer Reminder', icon: '⏰' },
                { type: 'customer_booking_confirmed', label: 'Customer Booking Confirmed', icon: '🎉' }
              ].map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => sendTestEmail(type)}
                  disabled={sendingTest === type || !settings.emailNotifications}
                  className="flex items-center justify-between p-4 bg-dark-gray border border-gray-600 rounded-lg hover:border-neon-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{icon}</span>
                    <span className="text-white font-medium">{label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {sendingTest === type ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neon-blue"></div>
                    ) : testResults[type] === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : testResults[type] === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Send className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {Object.values(testResults).some(result => result === 'error') && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">
                  <strong>Error:</strong> Failed to send test email. Please check your Resend API key configuration in Vercel environment variables.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
