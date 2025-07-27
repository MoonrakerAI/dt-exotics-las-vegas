'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { Save, Mail, Globe, Bell, Send, CheckCircle, AlertTriangle, DollarSign, Settings } from 'lucide-react'

export default function SettingsAdmin() {
  const [settings, setSettings] = useState({
    general: {
      siteName: 'DT Exotics Las Vegas',
      siteDescription: 'Luxury Exotic Car Rentals in Las Vegas',
      contactEmail: 'info@dtexoticslv.com',
      supportEmail: 'support@dtexoticslv.com',
      phoneNumber: '+1 (702) 123-4567'
    },
    notifications: {
      emailNotifications: true,
      bookingAlerts: true,
      paymentAlerts: true,
      systemAlerts: true,
      adminEmail: 'admin@dtexoticslv.com'
    }
  })

  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<{[key: string]: 'success' | 'error' | null}>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({
          ...prev,
          notifications: data.settings
        }))
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
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: settings.notifications })
      })
      
      if (response.ok) {
        alert('Settings saved successfully!')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save settings. Please try again.')
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

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]

  return (
    <div className="pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="glass-panel bg-dark-metal/30 p-8 mb-8 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-tech font-bold text-white mb-4">
                System <span className="neon-text">Settings</span>
              </h1>
              <p className="text-xl text-gray-300">
                Configure application settings and integrations
              </p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="glass-panel bg-dark-metal/20 p-4 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-neon-blue text-black'
                          : 'text-gray-300 hover:text-white hover:bg-dark-metal/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            <div className="glass-panel bg-dark-metal/20 p-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
              
              {/* General Settings */}
              {activeTab === 'general' && (
                <div>
                  <h3 className="text-2xl font-tech font-bold text-white mb-6">General Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
                      <input
                        type="text"
                        value={settings.general.siteName}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, siteName: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
                      <textarea
                        value={settings.general.siteDescription}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, siteDescription: e.target.value }
                        })}
                        rows={3}
                        className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                        <input
                          type="email"
                          value={settings.general.contactEmail}
                          onChange={(e) => setSettings({
                            ...settings,
                            general: { ...settings.general, contactEmail: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Support Email</label>
                        <input
                          type="email"
                          value={settings.general.supportEmail}
                          onChange={(e) => setSettings({
                            ...settings,
                            general: { ...settings.general, supportEmail: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={settings.general.phoneNumber}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, phoneNumber: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}



              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h3 className="text-2xl font-tech font-bold text-white mb-6">Notification Settings</h3>
                  
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue mx-auto"></div>
                      <p className="text-gray-400 mt-2">Loading settings...</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Admin Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email Address</label>
                        <input
                          type="email"
                          value={settings.notifications.adminEmail}
                          onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, adminEmail: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                          placeholder="admin@dtexoticslv.com"
                        />
                        <p className="text-sm text-gray-400 mt-1">Email address where notifications will be sent</p>
                      </div>

                      {/* Notification Types */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-white">Notification Types</h4>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-300 font-medium">Email Notifications</span>
                            <p className="text-sm text-gray-400">Master toggle for all email notifications</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.emailNotifications}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, emailNotifications: e.target.checked }
                            })}
                            className="w-5 h-5 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-300 font-medium">Booking Alerts</span>
                            <p className="text-sm text-gray-400">New bookings, cancellations, and modifications</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.bookingAlerts}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, bookingAlerts: e.target.checked }
                            })}
                            className="w-5 h-5 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-300 font-medium">Payment Alerts</span>
                            <p className="text-sm text-gray-400">Payment successes, failures, and refunds</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.paymentAlerts}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, paymentAlerts: e.target.checked }
                            })}
                            className="w-5 h-5 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-300 font-medium">System Alerts</span>
                            <p className="text-sm text-gray-400">System errors, maintenance, and important updates</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.systemAlerts}
                            onChange={(e) => setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, systemAlerts: e.target.checked }
                            })}
                            className="w-5 h-5 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
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
                            { type: 'system', label: 'System Alert', icon: '⚠️' }
                          ].map(({ type, label, icon }) => (
                            <button
                              key={type}
                              onClick={() => sendTestEmail(type)}
                              disabled={sendingTest === type || !settings.notifications.emailNotifications}
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
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}