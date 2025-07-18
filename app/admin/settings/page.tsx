'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { Save, Key, Mail, Globe, DollarSign, Shield, Bell, Database } from 'lucide-react'

export default function SettingsAdmin() {
  const [settings, setSettings] = useState({
    general: {
      siteName: 'DT Exotics Las Vegas',
      siteDescription: 'Luxury Exotic Car Rentals in Las Vegas',
      contactEmail: 'info@dtexoticslv.com',
      supportEmail: 'support@dtexoticslv.com',
      phoneNumber: '+1 (702) 123-4567'
    },
    payments: {
      stripePublishableKey: 'pk_test_...',
      stripeSecretKey: '••••••••••••••••',
      defaultCurrency: 'USD',
      taxRate: '8.25',
      processingFee: '2.9'
    },
    security: {
      adminToken: '••••••••••••••••',
      sessionTimeout: '24',
      enableTwoFactor: false,
      allowedDomains: 'dtexoticslv.com'
    },
    notifications: {
      emailNotifications: true,
      bookingAlerts: true,
      paymentAlerts: true,
      systemAlerts: true
    }
  })

  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    // Show success message
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'security', label: 'Security', icon: Shield },
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

              {/* Payment Settings */}
              {activeTab === 'payments' && (
                <div>
                  <h3 className="text-2xl font-tech font-bold text-white mb-6">Payment Settings</h3>
                  <div className="space-y-6">
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-300 text-sm">
                        <strong>Important:</strong> Changes to payment settings will affect all future transactions. Test thoroughly before going live.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Stripe Publishable Key</label>
                      <input
                        type="text"
                        value={settings.payments.stripePublishableKey}
                        onChange={(e) => setSettings({
                          ...settings,
                          payments: { ...settings.payments, stripePublishableKey: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Stripe Secret Key</label>
                      <input
                        type="password"
                        value={settings.payments.stripeSecretKey}
                        onChange={(e) => setSettings({
                          ...settings,
                          payments: { ...settings.payments, stripeSecretKey: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                        <select
                          value={settings.payments.defaultCurrency}
                          onChange={(e) => setSettings({
                            ...settings,
                            payments: { ...settings.payments, defaultCurrency: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tax Rate (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={settings.payments.taxRate}
                          onChange={(e) => setSettings({
                            ...settings,
                            payments: { ...settings.payments, taxRate: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Processing Fee (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={settings.payments.processingFee}
                          onChange={(e) => setSettings({
                            ...settings,
                            payments: { ...settings.payments, processingFee: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div>
                  <h3 className="text-2xl font-tech font-bold text-white mb-6">Security Settings</h3>
                  <div className="space-y-6">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <p className="text-red-300 text-sm">
                        <strong>Warning:</strong> Changing security settings incorrectly may lock you out of the admin panel.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Admin Token</label>
                      <input
                        type="password"
                        value={settings.security.adminToken}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, adminToken: e.target.value }
                        })}
                        className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (hours)</label>
                        <input
                          type="number"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, sessionTimeout: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Allowed Domains</label>
                        <input
                          type="text"
                          value={settings.security.allowedDomains}
                          onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, allowedDomains: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.security.enableTwoFactor}
                          onChange={(e) => setSettings({
                            ...settings,
                            security: { ...settings.security, enableTwoFactor: e.target.checked }
                          })}
                          className="w-5 h-5 text-neon-blue bg-dark-metal border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                        />
                        <span className="text-gray-300">Enable Two-Factor Authentication</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h3 className="text-2xl font-tech font-bold text-white mb-6">Notification Settings</h3>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-300 font-medium">Email Notifications</span>
                          <p className="text-sm text-gray-400">Receive general email notifications</p>
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
                          <p className="text-sm text-gray-400">Get notified of new bookings and cancellations</p>
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
                          <p className="text-sm text-gray-400">Receive alerts for payment successes and failures</p>
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
                          <p className="text-sm text-gray-400">Get notified of system errors and maintenance</p>
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
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}