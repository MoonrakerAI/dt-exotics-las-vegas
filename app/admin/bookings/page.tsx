'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '../../lib/rental-utils'
import { RentalBooking } from '../../types/rental'
import { SimpleAuth } from '../../lib/simple-auth'
import { Calendar, Search, Filter, Download, Eye, Edit, CreditCard, X, Clock, CheckCircle, AlertCircle, Plus, DollarSign, CalendarDays, Trash2 } from 'lucide-react'

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<RentalBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<RentalBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter and search state
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('month') // Default to 1 month
  const [carFilter, setCarFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_desc')
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [amountRangeFilter, setAmountRangeFilter] = useState({ min: '', max: '' })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Additional charge modal state
  const [showAdditionalChargeModal, setShowAdditionalChargeModal] = useState(false)
  const [selectedBookingForCharge, setSelectedBookingForCharge] = useState<RentalBooking | null>(null)
  const [additionalChargeAmount, setAdditionalChargeAmount] = useState('')
  const [additionalChargeMemo, setAdditionalChargeMemo] = useState('')
  const [chargingAdditional, setChargingAdditional] = useState(false)
  
  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<RentalBooking | null>(null)
  const [rescheduleStartDate, setRescheduleStartDate] = useState('')
  const [rescheduleEndDate, setRescheduleEndDate] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  
  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<RentalBooking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    filterAndSortBookings()
  }, [bookings, statusFilter, dateFilter, carFilter, searchQuery, sortBy, customDateRange, paymentStatusFilter, amountRangeFilter])

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        throw new Error('No admin token found')
      }

      const response = await fetch('/api/admin/rentals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data.rentals || [])

    } catch (err) {
      console.error('Bookings fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortBookings = () => {
    let filtered = [...bookings]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Date filter (Stripe-style)
    const now = new Date()
    if (dateFilter === 'today') {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.createdAt)
        return bookingDate.toDateString() === now.toDateString()
      })
    } else if (dateFilter === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) >= weekAgo
      )
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) >= monthAgo
      )
    } else if (dateFilter === '3months') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) >= threeMonthsAgo
      )
    } else if (dateFilter === '6months') {
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) >= sixMonthsAgo
      )
    } else if (dateFilter === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(booking => 
        new Date(booking.createdAt) >= yearAgo
      )
    } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start)
      const endDate = new Date(customDateRange.end)
      endDate.setHours(23, 59, 59, 999) // Include the entire end date
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.createdAt)
        return bookingDate >= startDate && bookingDate <= endDate
      })
    }

    // Car filter
    if (carFilter !== 'all') {
      filtered = filtered.filter(booking => 
        `${booking.car.brand}_${booking.car.model}_${booking.car.year}` === carFilter
      )
    }

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

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(booking => {
        if (paymentStatusFilter === 'deposit_pending') {
          return booking.payment.depositStatus === 'pending'
        } else if (paymentStatusFilter === 'deposit_captured') {
          return booking.payment.depositStatus === 'captured'
        } else if (paymentStatusFilter === 'deposit_authorized') {
          return booking.payment.depositStatus === 'authorized'
        } else if (paymentStatusFilter === 'final_pending') {
          return booking.payment.finalPaymentStatus === 'pending'
        } else if (paymentStatusFilter === 'final_completed') {
          return booking.payment.finalPaymentStatus === 'succeeded'
        } else if (paymentStatusFilter === 'fully_paid') {
          return booking.payment.depositStatus === 'captured' && booking.payment.finalPaymentStatus === 'succeeded'
        }
        return true
      })
    }

    // Amount range filter
    if (amountRangeFilter.min || amountRangeFilter.max) {
      filtered = filtered.filter(booking => {
        const amount = booking.pricing.finalAmount
        const min = amountRangeFilter.min ? parseFloat(amountRangeFilter.min) : 0
        const max = amountRangeFilter.max ? parseFloat(amountRangeFilter.max) : Infinity
        return amount >= min && amount <= max
      })
    }

    // Sort
    switch (sortBy) {
      case 'created_desc':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'created_asc':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'amount_desc':
        filtered.sort((a, b) => b.pricing.finalAmount - a.pricing.finalAmount)
        break
      case 'amount_asc':
        filtered.sort((a, b) => a.pricing.finalAmount - b.pricing.finalAmount)
        break
      case 'dates_desc':
        filtered.sort((a, b) => new Date(b.rentalDates.startDate).getTime() - new Date(a.rentalDates.startDate).getTime())
        break
      case 'dates_asc':
        filtered.sort((a, b) => new Date(a.rentalDates.startDate).getTime() - new Date(b.rentalDates.startDate).getTime())
        break
    }

    setFilteredBookings(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'completed':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <X className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const handleCaptureDeposit = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/rentals/${bookingId}/capture-deposit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to capture deposit')
      }

      // Refresh bookings
      await fetchBookings()
      alert('Deposit captured successfully!')
    } catch (err) {
      console.error('Deposit capture error:', err)
      alert('Failed to capture deposit: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleChargeFinal = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    // Create a modal for payment details
    const amount = prompt(`Enter final amount to charge (Current: ${formatCurrency(booking.pricing.finalAmount)}):`, booking.pricing.finalAmount.toString())
    if (!amount) return

    const memo = prompt('Enter memo/notes for this charge (optional):') || ''

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/rentals/${bookingId}/charge-final`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          finalAmount: parseFloat(amount),
          memo: memo.trim(),
          additionalCharges: parseFloat(amount) - booking.pricing.finalAmount
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to charge final amount')
      }

      // Refresh bookings
      await fetchBookings()
      alert('Final payment charged successfully!')
    } catch (err) {
      console.error('Final charge error:', err)
      alert('Failed to charge final amount: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }


  const handleChargeAdditional = (booking: RentalBooking) => {
    setSelectedBookingForCharge(booking)
    setAdditionalChargeAmount('')
    setAdditionalChargeMemo('')
    setShowAdditionalChargeModal(true)
  }

  const processAdditionalCharge = async () => {
    if (!selectedBookingForCharge || !additionalChargeAmount || parseFloat(additionalChargeAmount) <= 0) {
      return
    }

    setChargingAdditional(true)

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/rentals/${selectedBookingForCharge.id}/charge-additional`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(additionalChargeAmount),
          memo: additionalChargeMemo.trim() || 'Additional charge'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to charge additional amount')
      }

      // Refresh bookings and close modal
      await fetchBookings()
      setShowAdditionalChargeModal(false)
      alert('Additional charge processed successfully!')
    } catch (err) {
      console.error('Additional charge error:', err)
      alert('Failed to process additional charge: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setChargingAdditional(false)
    }
  }

  const handleExportBookings = () => {
    // Create CSV content
    const headers = [
      'Booking ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Vehicle',
      'Start Date',
      'End Date',
      'Days',
      'Amount',
      'Status',
      'Deposit Status',
      'Final Payment Status',
      'Created At'
    ]

    const csvData = filteredBookings.map(booking => [
      booking.id,
      `${booking.customer.firstName} ${booking.customer.lastName}`,
      booking.customer.email,
      booking.customer.phone,
      `${booking.car.brand} ${booking.car.model} (${booking.car.year})`,
      new Date(booking.rentalDates.startDate).toLocaleDateString(),
      new Date(booking.rentalDates.endDate).toLocaleDateString(),
      booking.pricing.totalDays,
      booking.pricing.finalAmount,
      booking.status,
      booking.payment.depositStatus,
      booking.payment.finalPaymentStatus || 'N/A',
      new Date(booking.createdAt).toLocaleDateString()
    ])

    // Create CSV string
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `dt-exotics-bookings-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleRescheduleBooking = (booking: RentalBooking) => {
    setSelectedBookingForReschedule(booking)
    setRescheduleStartDate(booking.rentalDates.startDate.split('T')[0])
    setRescheduleEndDate(booking.rentalDates.endDate.split('T')[0])
    setRescheduleReason('')
    setShowRescheduleModal(true)
  }

  const processReschedule = async () => {
    if (!selectedBookingForReschedule || !rescheduleStartDate || !rescheduleEndDate) {
      return
    }

    setRescheduling(true)

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/rentals/${selectedBookingForReschedule.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: rescheduleStartDate,
          endDate: rescheduleEndDate,
          reason: rescheduleReason.trim() || 'Rescheduled by admin'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reschedule booking')
      }

      const result = await response.json()
      
      // Refresh bookings and close modal
      await fetchBookings()
      setShowRescheduleModal(false)
      
      // Show pricing change alert if any
      if (result.data.pricingChange.difference !== 0) {
        const changeText = result.data.pricingChange.difference > 0 
          ? `increased by ${formatCurrency(result.data.pricingChange.difference)}`
          : `decreased by ${formatCurrency(Math.abs(result.data.pricingChange.difference))}`
        alert(`Booking rescheduled successfully! Total amount ${changeText}.`)
      } else {
        alert('Booking rescheduled successfully!')
      }
    } catch (err) {
      console.error('Reschedule error:', err)
      alert('Failed to reschedule booking: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setRescheduling(false)
    }
  }

  const handleCancelBookingModal = (booking: RentalBooking) => {
    setSelectedBookingForCancel(booking)
    setCancelReason('')
    setRefundAmount(booking.pricing.depositAmount.toString()) // Default to deposit amount
    setShowCancelModal(true)
  }

  const processCancel = async () => {
    if (!selectedBookingForCancel || !cancelReason.trim()) {
      return
    }

    setCancelling(true)

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/rentals/${selectedBookingForCancel.id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: cancelReason.trim(),
          refundAmount: parseFloat(refundAmount) || 0
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel booking')
      }

      // Refresh bookings and close modal
      await fetchBookings()
      setShowCancelModal(false)
      alert('Booking cancelled successfully! Please process refund manually if applicable.')
    } catch (err) {
      console.error('Cancel error:', err)
      alert('Failed to cancel booking: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setCancelling(false)
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
          <p className="text-gray-400">Loading bookings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-tech mb-4">Error Loading Bookings</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={fetchBookings} className="btn-primary">
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-tech font-bold text-white mb-2">
              Booking Management
            </h1>
            <p className="text-xl text-gray-300">
              Manage reservations, payments, and customer bookings
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExportBookings}
              className="btn-secondary flex items-center space-x-2"
              title={`Export ${filteredBookings.length} bookings to CSV`}
            >
              <Download className="w-5 h-5" />
              <span>Export ({filteredBookings.length})</span>
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel bg-dark-metal/50 p-4 border border-gray-600/30 rounded-xl text-center">
            <p className="text-2xl font-tech font-bold text-white">{filteredBookings.length}</p>
            <p className="text-sm text-gray-400">Total Bookings</p>
          </div>
          <div className="glass-panel bg-dark-metal/50 p-4 border border-gray-600/30 rounded-xl text-center">
            <p className="text-2xl font-tech font-bold text-green-400">
              {filteredBookings.filter(b => b.status === 'active' || b.status === 'confirmed').length}
            </p>
            <p className="text-sm text-gray-400">Active</p>
          </div>
          <div className="glass-panel bg-dark-metal/50 p-4 border border-gray-600/30 rounded-xl text-center">
            <p className="text-2xl font-tech font-bold text-yellow-400">
              {filteredBookings.filter(b => b.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-400">Pending</p>
          </div>
          <div className="glass-panel bg-dark-metal/50 p-4 border border-gray-600/30 rounded-xl text-center">
            <p className="text-2xl font-tech font-bold text-neon-blue">
              {formatCurrency(filteredBookings.reduce((sum, b) => sum + b.pricing.finalAmount, 0))}
            </p>
            <p className="text-sm text-gray-400">Total Value</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="glass-panel bg-dark-metal/50 p-6 border border-gray-600/30 rounded-2xl mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Car Filter */}
            <select
              value={carFilter}
              onChange={(e) => setCarFilter(e.target.value)}
              className="w-full px-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
            >
              <option value="all">All Cars</option>
              {Array.from(new Set(bookings.map(b => `${b.car.brand}_${b.car.model}_${b.car.year}`))).map(carKey => {
                const [brand, model, year] = carKey.split('_')
                return (
                  <option key={carKey} value={carKey}>
                    {brand} {model} ({year})
                  </option>
                )
              })}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
              <option value="dates_desc">Latest Rental Date</option>
              <option value="dates_asc">Earliest Rental Date</option>
            </select>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mt-4 pt-4 border-t border-gray-600/30">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2 text-neon-blue hover:text-neon-blue/80 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Advanced Filters</span>
              <span className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-600/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Status Filter */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Payment Status</label>
                  <select
                    value={paymentStatusFilter}
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  >
                    <option value="all">All Payment Statuses</option>
                    <option value="deposit_pending">Deposit Pending</option>
                    <option value="deposit_authorized">Deposit Authorized</option>
                    <option value="deposit_captured">Deposit Captured</option>
                    <option value="final_pending">Final Payment Pending</option>
                    <option value="final_completed">Final Payment Completed</option>
                    <option value="fully_paid">Fully Paid</option>
                  </select>
                </div>

                {/* Amount Range */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Amount Range ($)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={amountRangeFilter.min}
                      onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, min: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                    />
                    <span className="text-gray-400 py-2">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={amountRangeFilter.max}
                      onChange={(e) => setAmountRangeFilter(prev => ({ ...prev, max: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
              
              {/* Clear Advanced Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setPaymentStatusFilter('all')
                    setAmountRangeFilter({ min: '', max: '' })
                  }}
                  className="px-4 py-2 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors text-sm"
                >
                  Clear Advanced Filters
                </button>
              </div>
            </div>
          )}

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-600/30">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">End Date</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-4 py-2 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bookings Table */}
        <div className="glass-panel bg-dark-metal/50 border border-gray-600/30 rounded-2xl overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No bookings found</p>
              <p className="text-gray-500">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-metal/30">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-400 font-tech">Booking ID</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-tech">Customer</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-tech">Vehicle</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-tech">Rental Period</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-tech">Amount</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-tech">Status</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-tech">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-700/50 hover:bg-gray-600/5">
                      <td className="py-4 px-6">
                        <div className="text-white font-tech text-sm">{booking.id.slice(0, 8)}</div>
                        <div className="text-gray-400 text-xs">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-white font-medium">
                          {booking.customer.firstName} {booking.customer.lastName}
                        </div>
                        <div className="text-gray-400 text-sm">{booking.customer.email}</div>
                        <div className="text-gray-400 text-xs">{booking.customer.phone}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-white font-medium">
                          {booking.car.brand} {booking.car.model}
                        </div>
                        <div className="text-gray-400 text-sm">{booking.car.year}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-white">
                          {new Date(booking.rentalDates.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-400 text-sm">
                          to {new Date(booking.rentalDates.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {booking.pricing.totalDays} days
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-white font-tech font-semibold">
                          {formatCurrency(booking.pricing.finalAmount)}
                        </div>
                        <div className="text-gray-400 text-xs">
                          Deposit: {formatCurrency(booking.pricing.depositAmount)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          <span>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          Payment: {booking.payment.depositStatus}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => window.location.href = `/admin/bookings/${booking.id}`}
                            className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {booking.payment.depositStatus === 'authorized' && (
                            <button 
                              onClick={() => handleCaptureDeposit(booking.id)}
                              className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                              title="Capture Deposit"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          {(booking.status === 'active' || booking.status === 'confirmed') && (
                            <button 
                              onClick={() => handleChargeFinal(booking.id)}
                              className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
                              title="Charge Final Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleChargeAdditional(booking)}
                            className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                            title="Charge Additional Fees"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <button 
                              onClick={() => handleRescheduleBooking(booking)}
                              className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
                              title="Reschedule Booking"
                            >
                              <CalendarDays className="w-4 h-4" />
                            </button>
                          )}
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <button 
                              onClick={() => handleCancelBookingModal(booking)}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                              title="Cancel Booking"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Additional Charge Modal */}
        {showAdditionalChargeModal && selectedBookingForCharge && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-metal border border-gray-600/30 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-tech font-bold text-white flex items-center space-x-2">
                  <DollarSign className="w-6 h-6 text-neon-blue" />
                  <span>Charge Additional Fee</span>
                </h3>
                <button
                  onClick={() => setShowAdditionalChargeModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Booking Info */}
                <div className="bg-dark-gray/50 p-4 rounded-lg border border-gray-600/20">
                  <p className="text-sm text-gray-400">Charging additional fee for:</p>
                  <p className="text-white font-medium">
                    {selectedBookingForCharge.customer.firstName} {selectedBookingForCharge.customer.lastName}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {selectedBookingForCharge.car.brand} {selectedBookingForCharge.car.model} 
                    ({selectedBookingForCharge.car.year})
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Booking ID: {selectedBookingForCharge.id.slice(0, 8)}...
                  </p>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Charge Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={additionalChargeAmount}
                    onChange={(e) => setAdditionalChargeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                </div>

                {/* Memo Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description / Memo
                  </label>
                  <textarea
                    value={additionalChargeMemo}
                    onChange={(e) => setAdditionalChargeMemo(e.target.value)}
                    placeholder="Reason for additional charge (e.g., damage, extra services, late fees)"
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none resize-none"
                  />
                </div>

                {/* Current Total */}
                <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-600/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Total:</span>
                    <span className="text-white">{formatCurrency(selectedBookingForCharge.pricing.finalAmount)}</span>
                  </div>
                  {additionalChargeAmount && parseFloat(additionalChargeAmount) > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Additional Charge:</span>
                        <span className="text-yellow-400">+{formatCurrency(parseFloat(additionalChargeAmount))}</span>
                      </div>
                      <hr className="border-gray-600/50 my-2" />
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-300">New Total:</span>
                        <span className="text-neon-blue">
                          {formatCurrency(selectedBookingForCharge.pricing.finalAmount + parseFloat(additionalChargeAmount))}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAdditionalChargeModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processAdditionalCharge}
                  disabled={!additionalChargeAmount || parseFloat(additionalChargeAmount) <= 0 || chargingAdditional}
                  className="flex-1 px-4 py-3 bg-neon-blue text-black font-medium rounded-lg hover:bg-neon-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {chargingAdditional ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Charge Card</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && selectedBookingForReschedule && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-metal border border-gray-600/30 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-tech font-bold text-white flex items-center space-x-2">
                  <CalendarDays className="w-6 h-6 text-neon-blue" />
                  <span>Reschedule Booking</span>
                </h3>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Booking Info */}
                <div className="bg-dark-gray/50 p-4 rounded-lg border border-gray-600/20">
                  <p className="text-sm text-gray-400">Rescheduling booking for:</p>
                  <p className="text-white font-medium">
                    {selectedBookingForReschedule.customer.firstName} {selectedBookingForReschedule.customer.lastName}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {selectedBookingForReschedule.car.brand} {selectedBookingForReschedule.car.model} 
                    ({selectedBookingForReschedule.car.year})
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Current: {new Date(selectedBookingForReschedule.rentalDates.startDate).toLocaleDateString()} - {new Date(selectedBookingForReschedule.rentalDates.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* New Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Start Date
                    </label>
                    <input
                      type="date"
                      value={rescheduleStartDate}
                      onChange={(e) => setRescheduleStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New End Date
                    </label>
                    <input
                      type="date"
                      value={rescheduleEndDate}
                      onChange={(e) => setRescheduleEndDate(e.target.value)}
                      min={rescheduleStartDate}
                      className="w-full px-3 py-2 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reason for Reschedule
                  </label>
                  <textarea
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="Optional reason for rescheduling..."
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none resize-none"
                  />
                </div>

                {/* Price Preview */}
                {rescheduleStartDate && rescheduleEndDate && (
                  <div className="bg-gray-700/30 p-3 rounded-lg border border-gray-600/20">
                    <div className="text-sm text-gray-400 mb-1">Pricing will be recalculated based on new dates</div>
                    <div className="text-xs text-gray-500">Original: {formatCurrency(selectedBookingForReschedule.pricing.finalAmount)}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processReschedule}
                  disabled={!rescheduleStartDate || !rescheduleEndDate || rescheduling}
                  className="flex-1 px-4 py-3 bg-neon-blue text-black font-medium rounded-lg hover:bg-neon-blue/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {rescheduling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      <span>Rescheduling...</span>
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4" />
                      <span>Reschedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedBookingForCancel && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-metal border border-gray-600/30 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-tech font-bold text-white flex items-center space-x-2">
                  <Trash2 className="w-6 h-6 text-red-400" />
                  <span>Cancel Booking</span>
                </h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Booking Info */}
                <div className="bg-dark-gray/50 p-4 rounded-lg border border-gray-600/20">
                  <p className="text-sm text-gray-400">Cancelling booking for:</p>
                  <p className="text-white font-medium">
                    {selectedBookingForCancel.customer.firstName} {selectedBookingForCancel.customer.lastName}
                  </p>
                  <p className="text-gray-300 text-sm">
                    {selectedBookingForCancel.car.brand} {selectedBookingForCancel.car.model} 
                    ({selectedBookingForCancel.car.year})
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(selectedBookingForCancel.rentalDates.startDate).toLocaleDateString()} - {new Date(selectedBookingForCancel.rentalDates.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reason for Cancellation *
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Required: Reason for cancelling this booking..."
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none resize-none"
                  />
                </div>

                {/* Refund Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Refund Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedBookingForCancel.pricing.finalAmount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Total paid: {formatCurrency(selectedBookingForCancel.pricing.finalAmount)} | 
                    Deposit: {formatCurrency(selectedBookingForCancel.pricing.depositAmount)}
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  <p className="text-red-400 text-sm">
                    ⚠️ This action cannot be undone. Refunds must be processed manually through Stripe.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors"
                >
                  Don't Cancel
                </button>
                <button
                  onClick={processCancel}
                  disabled={!cancelReason.trim() || cancelling}
                  className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Cancel Booking</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 