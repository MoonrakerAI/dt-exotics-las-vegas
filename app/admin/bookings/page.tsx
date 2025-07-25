'use client'

import { useState, useEffect } from 'react'
import { SimpleAuth } from '../../lib/simple-auth'
import { RentalBooking, AdditionalPayment } from '../../types/rental'
import { BookingFilter } from '../../types/admin'
import { formatCurrency } from '../../lib/rental-utils'
import { 
  Search, 
  Filter, 
  Calendar, 
  Car, 
  User, 
  DollarSign, 
  History, 
  Edit,
  Trash2,
  Plus,
  CreditCard,
  Ban,
  RefreshCw,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface BookingTableProps {
  bookings: RentalBooking[]
  onEdit: (booking: RentalBooking) => void
  onCancel: (booking: RentalBooking) => void
  onReschedule: (booking: RentalBooking) => void
  onAdditionalPayment: (booking: RentalBooking) => void
  onViewHistory: (booking: RentalBooking) => void
}

function BookingTable({ bookings, onEdit, onCancel, onReschedule, onAdditionalPayment, onViewHistory }: BookingTableProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-400" />
      case 'active':
        return <Car className="w-4 h-4 text-green-400" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'rescheduled':
        return <RefreshCw className="w-4 h-4 text-orange-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
      case 'confirmed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'completed': return 'bg-green-600/10 text-green-500 border-green-600/20'
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'rescheduled': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  return (
    <div className="glass-panel bg-dark-metal/20 border border-gray-600/30 rounded-2xl backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-metal/50 border-b border-gray-600/30">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Customer</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Vehicle</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Dates</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600/30">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-dark-metal/20 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">
                      {booking.customer.firstName} {booking.customer.lastName}
                    </p>
                    <p className="text-gray-400 text-sm">{booking.customer.email}</p>
                    <p className="text-gray-500 text-xs">{booking.customer.phone}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">
                      {booking.car.brand} {booking.car.model}
                    </p>
                    <p className="text-gray-400 text-sm">{booking.car.year}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white text-sm">
                      {new Date(booking.rentalDates.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-400 text-sm">to</p>
                    <p className="text-white text-sm">
                      {new Date(booking.rentalDates.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-500 text-xs">{booking.pricing.totalDays} days</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-white font-medium">
                      {formatCurrency(booking.payment.totalPaid || booking.pricing.subtotal)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      of {formatCurrency(booking.pricing.subtotal)}
                    </p>
                    {booking.payment.additionalPayments && booking.payment.additionalPayments.length > 0 && (
                      <p className="text-neon-blue text-xs">
                        +{booking.payment.additionalPayments.length} additional
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span>{booking.status.toUpperCase()}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewHistory(booking)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-metal/50 rounded-lg transition-colors"
                      title="View History"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <>
                        <button
                          onClick={() => onEdit(booking)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-dark-metal/50 rounded-lg transition-colors"
                          title="Edit Booking"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReschedule(booking)}
                          className="p-2 text-gray-400 hover:text-neon-blue hover:bg-dark-metal/50 rounded-lg transition-colors"
                          title="Reschedule"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAdditionalPayment(booking)}
                          className="p-2 text-gray-400 hover:text-green-400 hover:bg-dark-metal/50 rounded-lg transition-colors"
                          title="Additional Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onCancel(booking)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-metal/50 rounded-lg transition-colors"
                          title="Cancel Booking"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function BookingsAdmin() {
  const [bookings, setBookings] = useState<RentalBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<RentalBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<BookingFilter>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<RentalBooking | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showAdditionalPaymentModal, setShowAdditionalPaymentModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [bookings, filter, searchQuery])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const token = SimpleAuth.getToken()
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...bookings]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(booking => 
        booking.customer.firstName.toLowerCase().includes(query) ||
        booking.customer.lastName.toLowerCase().includes(query) ||
        booking.customer.email.toLowerCase().includes(query) ||
        booking.car.brand.toLowerCase().includes(query) ||
        booking.car.model.toLowerCase().includes(query) ||
        booking.id.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter(booking => filter.status!.includes(booking.status))
    }

    // Date range filter
    if (filter.dateRange?.start && filter.dateRange?.end) {
      const start = new Date(filter.dateRange.start)
      const end = new Date(filter.dateRange.end)
      filtered = filtered.filter(booking => {
        const bookingStart = new Date(booking.rentalDates.startDate)
        return bookingStart >= start && bookingStart <= end
      })
    }

    // Car filter
    if (filter.carId) {
      filtered = filtered.filter(booking => booking.carId === filter.carId)
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = getFilterValue(a, filter.sortBy!)
      const bValue = getFilterValue(b, filter.sortBy!)
      
      if (filter.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredBookings(filtered)
  }

  const getFilterValue = (booking: RentalBooking, sortBy: string) => {
    switch (sortBy) {
      case 'createdAt':
        return new Date(booking.createdAt).getTime()
      case 'startDate':
        return new Date(booking.rentalDates.startDate).getTime()
      case 'customerName':
        return `${booking.customer.firstName} ${booking.customer.lastName}`.toLowerCase()
      case 'carModel':
        return `${booking.car.brand} ${booking.car.model}`.toLowerCase()
      case 'totalAmount':
        return booking.pricing.subtotal
      default:
        return booking.createdAt
    }
  }

  const handleEdit = (booking: RentalBooking) => {
    setSelectedBooking(booking)
    // TODO: Open edit modal
  }

  const handleCancel = (booking: RentalBooking) => {
    setSelectedBooking(booking)
    setShowCancelModal(true)
  }

  const handleReschedule = (booking: RentalBooking) => {
    setSelectedBooking(booking)
    setShowRescheduleModal(true)
  }

  const handleAdditionalPayment = (booking: RentalBooking) => {
    setSelectedBooking(booking)
    setShowAdditionalPaymentModal(true)
  }

  const handleViewHistory = (booking: RentalBooking) => {
    setSelectedBooking(booking)
    setShowHistoryModal(true)
  }

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    active: bookings.filter(b => b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue: bookings.reduce((sum, b) => sum + (b.payment.totalPaid || 0), 0)
  }

  return (
    <div className="pt-8 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-panel bg-dark-metal/30 p-8 mb-8 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-tech font-bold text-white mb-4">
                Booking <span className="neon-text">Management</span>
              </h1>
              <p className="text-xl text-gray-300">
                Comprehensive booking history and management tools
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <button className="btn-secondary flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>New Booking</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="glass-panel bg-dark-metal/20 p-4 border border-gray-600/30 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-white">{stats.total}</p>
            <p className="text-gray-400 text-sm">Total</p>
          </div>
          <div className="glass-panel bg-yellow-500/10 p-4 border border-yellow-500/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-yellow-300 text-sm">Pending</p>
          </div>
          <div className="glass-panel bg-blue-500/10 p-4 border border-blue-500/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-blue-400">{stats.confirmed}</p>
            <p className="text-blue-300 text-sm">Confirmed</p>
          </div>
          <div className="glass-panel bg-green-500/10 p-4 border border-green-500/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-green-400">{stats.active}</p>
            <p className="text-green-300 text-sm">Active</p>
          </div>
          <div className="glass-panel bg-green-600/10 p-4 border border-green-600/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-green-500">{stats.completed}</p>
            <p className="text-green-400 text-sm">Completed</p>
          </div>
          <div className="glass-panel bg-red-500/10 p-4 border border-red-500/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-red-400">{stats.cancelled}</p>
            <p className="text-red-300 text-sm">Cancelled</p>
          </div>
          <div className="glass-panel bg-neon-blue/10 p-4 border border-neon-blue/20 rounded-xl backdrop-blur-sm text-center">
            <p className="text-2xl font-tech font-bold text-neon-blue">{formatCurrency(stats.revenue)}</p>
            <p className="text-blue-300 text-sm">Revenue</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="glass-panel bg-dark-metal/20 p-6 mb-6 border border-gray-600/30 rounded-2xl backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  showFilters
                    ? 'bg-neon-blue text-black'
                    : 'bg-dark-metal/50 text-gray-300 hover:text-white border border-gray-600/30'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filter.sortBy}
                onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="px-3 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-neon-blue"
              >
                <option value="createdAt">Sort by Date Created</option>
                <option value="startDate">Sort by Start Date</option>
                <option value="customerName">Sort by Customer</option>
                <option value="carModel">Sort by Vehicle</option>
                <option value="totalAmount">Sort by Amount</option>
              </select>
              <button
                onClick={() => setFilter(prev => ({ 
                  ...prev, 
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                }))}
                className="p-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                {filter.sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-600/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    multiple
                    value={filter.status || []}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value)
                      setFilter(prev => ({ ...prev, status: values }))
                    }}
                    className="w-full px-3 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-neon-blue"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={filter.dateRange?.start || ''}
                      onChange={(e) => setFilter(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, start: e.target.value } 
                      }))}
                      className="flex-1 px-3 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-neon-blue"
                    />
                    <input
                      type="date"
                      value={filter.dateRange?.end || ''}
                      onChange={(e) => setFilter(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, end: e.target.value } 
                      }))}
                      className="flex-1 px-3 py-2 bg-dark-metal/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:border-neon-blue"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilter({ sortBy: 'createdAt', sortOrder: 'desc' })
                      setSearchQuery('')
                    }}
                    className="w-full px-4 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="glass-panel bg-dark-metal/20 p-12 border border-gray-600/30 rounded-2xl backdrop-blur-sm text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
            <p className="text-gray-300 mt-4">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="glass-panel bg-dark-metal/20 p-12 border border-gray-600/30 rounded-2xl backdrop-blur-sm text-center">
            <p className="text-gray-300 text-lg">No bookings found</p>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <BookingTable
            bookings={filteredBookings}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onAdditionalPayment={handleAdditionalPayment}
            onViewHistory={handleViewHistory}
          />
        )}

        {/* TODO: Add modals for history, additional payment, reschedule, cancel */}
      </div>
    </div>
  )
}