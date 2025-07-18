'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatCurrency } from '../lib/rental-utils'
import { RentalBooking } from '../types/rental'

interface AdminDashboardProps {
  rentals: RentalBooking[]
}

function RentalCard({ rental }: { rental: RentalBooking }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCaptureDeposit = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/rentals/${rental.id}/capture-deposit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-secret-token'}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to capture deposit')
      }

      // Refresh page to show updated status
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture deposit')
    } finally {
      setLoading(false)
    }
  }

  const handleChargeFinal = async () => {
    const finalAmount = prompt('Enter final amount to charge:', rental.pricing.finalAmount.toString())
    if (!finalAmount) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/rentals/${rental.id}/charge-final`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-secret-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          finalAmount: parseFloat(finalAmount),
          additionalCharges: 0
        })
      })

      const data = await response.json()

      if (data.requiresAuth) {
        alert('Customer authentication required. They will be notified via email.')
      } else if (!response.ok) {
        throw new Error(data.error || 'Failed to charge final amount')
      }

      // Refresh page to show updated status
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to charge final amount')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400'
      case 'confirmed': return 'text-blue-400'
      case 'active': return 'text-green-400'
      case 'completed': return 'text-green-500'
      case 'cancelled': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-tech font-bold text-white">
            {rental.car.brand} {rental.car.model} ({rental.car.year})
          </h3>
          <p className="text-gray-400">Rental ID: {rental.id}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
          {rental.status.toUpperCase()}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-lg font-tech font-semibold text-white mb-2">Customer</h4>
          <p className="text-gray-300">{rental.customer.firstName} {rental.customer.lastName}</p>
          <p className="text-gray-400">{rental.customer.email}</p>
          <p className="text-gray-400">{rental.customer.phone}</p>
        </div>
        <div>
          <h4 className="text-lg font-tech font-semibold text-white mb-2">Rental Period</h4>
          <p className="text-gray-300">{new Date(rental.rentalDates.startDate).toLocaleDateString()}</p>
          <p className="text-gray-400">to {new Date(rental.rentalDates.endDate).toLocaleDateString()}</p>
          <p className="text-gray-400">{rental.pricing.totalDays} days</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Deposit</p>
          <p className="text-white font-tech font-semibold">
            {formatCurrency(rental.pricing.depositAmount)}
          </p>
          <p className="text-xs text-gray-500">{rental.payment.depositStatus}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Final Amount</p>
          <p className="text-white font-tech font-semibold">
            {formatCurrency(rental.pricing.finalAmount)}
          </p>
          <p className="text-xs text-gray-500">{rental.payment.finalPaymentStatus || 'pending'}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-white font-tech font-semibold">
            {formatCurrency(rental.pricing.subtotal)}
          </p>
          <p className="text-xs text-gray-500">{formatCurrency(rental.pricing.dailyRate)}/day</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        {rental.payment.depositStatus === 'authorized' && (
          <button
            onClick={handleCaptureDeposit}
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Capture Deposit'}
          </button>
        )}
        
        {rental.status === 'active' && !rental.payment.finalPaymentIntentId && (
          <button
            onClick={handleChargeFinal}
            disabled={loading}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Charge Final Amount'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [rentals, setRentals] = useState<RentalBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  useEffect(() => {
    fetchRentals()
  }, [filter])

  const fetchRentals = async () => {
    setLoading(true)
    setError('')

    try {
      const url = filter === 'all' 
        ? '/api/admin/rentals' 
        : `/api/admin/rentals?status=${filter}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-secret-token'}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch rentals')
      }

      const data = await response.json()
      setRentals(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rentals')
    } finally {
      setLoading(false)
    }
  }

  const filteredRentals = rentals.filter(rental => {
    if (filter === 'all') return true
    return rental.status === filter
  })

  return (
    <div className="pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-tech font-bold text-white mb-4">
            Dashboard <span className="neon-text">Overview</span>
          </h1>
          <p className="text-xl text-gray-400">
            Manage rental bookings and payments
          </p>
        </div>

          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-tech font-medium transition-all duration-300 ${
                    filter === status
                      ? 'bg-neon-blue text-black'
                      : 'bg-dark-metal text-gray-400 hover:text-white'
                  }`}
                >
                  {status.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
              <p className="text-gray-400 mt-4">Loading rentals...</p>
            </div>
          ) : filteredRentals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No rentals found</p>
            </div>
          ) : (
            <div>
              {filteredRentals.map(rental => (
                <RentalCard key={rental.id} rental={rental} />
              ))}
            </div>
          )}
        </div>
      </div>
  )
}