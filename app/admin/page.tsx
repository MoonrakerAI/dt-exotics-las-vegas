'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/rental-utils'
import { RentalBooking } from '../types/rental'
import { SimpleAuth } from '../lib/simple-auth'
import { Car, Calendar, DollarSign, Users, TrendingUp, Clock, AlertCircle, CheckCircle, Plus, Eye, Edit, MoreHorizontal } from 'lucide-react'

interface DashboardStats {
  totalBookings: number
  activeRentals: number
  totalRevenue: number
  availableCars: number
  pendingPayments: number
  completedBookings: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeRentals: 0,
    totalRevenue: 0,
    availableCars: 0,
    pendingPayments: 0,
    completedBookings: 0
  })
  const [recentBookings, setRecentBookings] = useState<RentalBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        throw new Error('No admin token found')
      }

      // Fetch bookings and stats in parallel
      const [bookingsRes, carsRes] = await Promise.all([
        fetch('/api/admin/rentals', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/fleet', {
          headers: { 'Authorization': `Bearer ${token}` }
      })
      ])

      if (!bookingsRes.ok) {
        const errorText = await bookingsRes.text()
        console.error('Bookings API error:', bookingsRes.status, errorText)
        throw new Error(`Failed to fetch bookings: ${bookingsRes.status}`)
      }
      
      if (!carsRes.ok) {
        const errorText = await carsRes.text()
        console.error('Fleet API error:', carsRes.status, errorText)
        throw new Error(`Failed to fetch fleet: ${carsRes.status}`)
      }

      const bookingsData = await bookingsRes.json()
      const carsData = await carsRes.json()
      
      // Handle different API response formats
      const bookings = bookingsData.data || bookingsData.rentals || []
      const cars = carsData.cars || []

      // Calculate stats
      const now = new Date()
      const activeRentals = bookings.filter((booking: RentalBooking) => 
        booking.status === 'active' || booking.status === 'confirmed'
      ).length
      
      const totalRevenue = bookings
        .filter((booking: RentalBooking) => booking.status === 'completed')
        .reduce((sum: number, booking: RentalBooking) => sum + booking.pricing.finalAmount, 0)
      
      const availableCars = cars.filter((car: any) => car.available).length
      
      const pendingPayments = bookings.filter((booking: RentalBooking) => 
        booking.payment.depositStatus === 'pending' || 
        booking.payment.finalPaymentStatus === 'pending'
      ).length

      const completedBookings = bookings.filter((booking: RentalBooking) => 
        booking.status === 'completed'
      ).length

      setStats({
        totalBookings: bookings.length,
        activeRentals,
        totalRevenue,
        availableCars,
        pendingPayments,
        completedBookings
      })

      // Get recent bookings (last 10)
      const recent = bookings
        .sort((a: RentalBooking, b: RentalBooking) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10)
      
      setRecentBookings(recent)

    } catch (err) {
      console.error('Dashboard error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'text-green-400 bg-green-400/10'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'completed':
        return 'text-blue-400 bg-blue-400/10'
      case 'cancelled':
        return 'text-red-400 bg-red-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-tech mb-4">Dashboard Error</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={fetchDashboardData} className="btn-primary">
            Try Again
          </button>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-dark-gray">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-tech font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-300">
            Overview of your rental business performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {/* Total Bookings */}
          <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Bookings</p>
                <p className="text-2xl font-tech font-bold text-white">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-neon-blue" />
            </div>
          </div>

          {/* Active Rentals */}
          <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Rentals</p>
                <p className="text-2xl font-tech font-bold text-green-400">{stats.activeRentals}</p>
              </div>
              <Clock className="w-8 h-8 text-green-400" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-tech font-bold text-neon-blue">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-neon-blue" />
            </div>
          </div>

          {/* Available Cars */}
          <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Available Cars</p>
                <p className="text-2xl font-tech font-bold text-white">{stats.availableCars}</p>
              </div>
              <Car className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          {/* Pending Payments */}
          <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Pending Payments</p>
                <p className="text-2xl font-tech font-bold text-yellow-400">{stats.pendingPayments}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          {/* Completed Bookings */}
          <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Completed</p>
                <p className="text-2xl font-tech font-bold text-blue-400">{stats.completedBookings}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <a href="/admin/fleet" className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl hover:border-neon-blue transition-colors group">
            <div className="flex items-center space-x-4">
              <Car className="w-8 h-8 text-neon-blue" />
              <div>
                <h3 className="text-lg font-tech font-bold text-white group-hover:text-neon-blue transition-colors">Manage Fleet</h3>
                <p className="text-gray-400">Add, edit, or configure vehicles</p>
              </div>
            </div>
          </a>

          <a href="/admin/bookings" className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl hover:border-neon-blue transition-colors group">
            <div className="flex items-center space-x-4">
              <Calendar className="w-8 h-8 text-neon-blue" />
              <div>
                <h3 className="text-lg font-tech font-bold text-white group-hover:text-neon-blue transition-colors">View Bookings</h3>
                <p className="text-gray-400">Manage reservations and payments</p>
              </div>
            </div>
          </a>

          <a href="/admin/invoices" className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl hover:border-neon-blue transition-colors group">
            <div className="flex items-center space-x-4">
              <DollarSign className="w-8 h-8 text-neon-blue" />
              <div>
                <h3 className="text-lg font-tech font-bold text-white group-hover:text-neon-blue transition-colors">Create Invoice</h3>
                <p className="text-gray-400">Generate custom invoices</p>
              </div>
            </div>
          </a>
        </div>

        {/* Recent Bookings */}
        <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-tech font-bold text-white">Recent Bookings</h2>
            <a href="/admin/bookings" className="text-neon-blue hover:text-neon-blue/80 font-tech">
              View All →
            </a>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No recent bookings</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 text-gray-400 font-tech">Customer</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-tech">Car</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-tech">Dates</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-tech">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-tech">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-tech">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-700/50 hover:bg-gray-600/10">
                      <td className="py-3 px-4 text-white">
            <div>
                          <div className="font-medium">{booking.customer.firstName} {booking.customer.lastName}</div>
                          <div className="text-sm text-gray-400">{booking.customer.email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white">
                        <div className="font-medium">{booking.car.brand} {booking.car.model}</div>
                        <div className="text-sm text-gray-400">{booking.car.year}</div>
                      </td>
                      <td className="py-3 px-4 text-white">
                        <div>{new Date(booking.rentalDates.startDate).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-400">to {new Date(booking.rentalDates.endDate).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-4 text-white font-tech">
                        {formatCurrency(booking.pricing.finalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => window.location.href = `/admin/bookings/${booking.id}`}
                            className="p-1 text-gray-400 hover:text-neon-blue transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-gray-400 hover:text-neon-blue transition-colors"
                            title="More Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>
  )
}