'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency } from '../../../lib/rental-utils'
import { RentalBooking } from '../../../types/rental'
import { SimpleAuth } from '../../../lib/simple-auth'
import { 
  ArrowLeft, 
  Calendar, 
  Car, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  X,
  DollarSign,
  Plus,
  Edit,
  FileText,
  Download
} from 'lucide-react'

export default function BookingDetail() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<RentalBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pricing adjustment modal state
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [finalAmount, setFinalAmount] = useState('')
  const [adjustmentMode, setAdjustmentMode] = useState<'adjustment' | 'final'>('final')
  const [reauthLoading, setReauthLoading] = useState(false)
  const [adjustmentMemo, setAdjustmentMemo] = useState('')
  const [chargeNow, setChargeNow] = useState(false)
  const [processingAdjustment, setProcessingAdjustment] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<{
    status: string
    amountCapturable: number | null
    latestChargeStatus?: string | null
  } | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchBookingDetail(params.id as string)
    }
  }, [params.id])

  const fetchBookingDetail = async (bookingId: string) => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) {
        throw new Error('No admin token found')
      }

      const response = await fetch(`/api/admin/rentals/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Booking not found')
        }
        throw new Error('Failed to fetch booking details')
      }

      const data = await response.json()
      const normalized = (data && (data.rental || (data.data && data.data.rental))) || null
      const rawPI = data?.paymentIntent || data?.data?.paymentIntent || null
      if (rawPI) {
        const amountCapturable = (typeof rawPI.amountCapturable === 'number')
          ? rawPI.amountCapturable
          : (typeof rawPI.amount_capturable === 'number' ? rawPI.amount_capturable : null)
        const latestChargeStatus = (rawPI.latestChargeStatus !== undefined)
          ? rawPI.latestChargeStatus
          : (rawPI.latest_charge && rawPI.latest_charge.status ? rawPI.latest_charge.status : null)
        setPaymentInfo({ status: String(rawPI.status), amountCapturable, latestChargeStatus })
      } else {
        setPaymentInfo(null)
      }
      if (!normalized) {
        throw new Error('Malformed booking response from server')
      }
      setBooking(normalized)

    } catch (err) {
      console.error('Booking detail fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const processPricingAdjustment = async () => {
    if (!booking) return

    let calculatedAdjustment: number
    
    if (adjustmentMode === 'final') {
      if (!finalAmount || isNaN(parseFloat(finalAmount))) return
      calculatedAdjustment = parseFloat(finalAmount) - booking.pricing.finalAmount
    } else {
      if (!adjustmentAmount || isNaN(parseFloat(adjustmentAmount))) return
      calculatedAdjustment = parseFloat(adjustmentAmount)
    }

    setProcessingAdjustment(true)

    try {
      const token = localStorage.getItem('dt-admin-token')
      const response = await fetch(`/api/admin/rentals/${booking.id}/charge-additional`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: calculatedAdjustment,
          memo: adjustmentMemo.trim() || (calculatedAdjustment > 0 ? 'Additional charge' : 'Discount/Refund'),
          chargeNow: chargeNow
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process charge')
      }

      const result = await response.json()
      
      // Refresh booking details and close modal
      await fetchBookingDetail(booking.id)
      setShowPricingModal(false)
      setAdjustmentAmount('')
      setFinalAmount('')
      setAdjustmentMemo('')
      setChargeNow(false)
      
      alert(result.message || 'Charge processed successfully!')
    } catch (err) {
      console.error('Charge processing error:', err)
      alert('Failed to process charge: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setProcessingAdjustment(false)
    }
  }

  // Re-authorize deposit using saved payment method (off_session)
  const reauthorizeDeposit = async () => {
    if (!booking) return
    setReauthLoading(true)
    try {
      const token = localStorage.getItem('dt-admin-token')
      if (!token) throw new Error('No admin token found')
      const res = await fetch(`/api/admin/rentals/${booking.id}/reauthorize-deposit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to re-authorize deposit')
      }
      // Refresh booking to pick up new PI id/status
      await fetchBookingDetail(booking.id)
      alert('Deposit re-authorization attempted. Current status: ' + (data?.data?.paymentIntent?.status || 'unknown'))
    } catch (e) {
      console.error('Re-authorize deposit error:', e)
      alert(e instanceof Error ? e.message : 'Failed to re-authorize deposit')
    } finally {
      setReauthLoading(false)
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-tech mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-neon-blue text-black font-tech rounded-lg hover:bg-neon-blue/80 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-tech mb-4">Booking Not Found</h1>
          <p className="text-gray-400 mb-6">The requested booking could not be found.</p>
          <button
            onClick={() => router.push('/admin/bookings')}
            className="px-6 py-3 bg-neon-blue text-black font-tech rounded-lg hover:bg-neon-blue/80 transition-colors"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/admin/bookings')}
              className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-tech font-bold text-white">
                Booking Details
              </h1>
              <p className="text-gray-400">Booking ID: {booking.id}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-2 ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
            </span>
          </div>
        </div>

        {/* Payment/Capture Status Banner */}
        {paymentInfo && (
          <div className="mb-6">
            {paymentInfo.status === 'requires_capture' && (paymentInfo.amountCapturable ?? 0) > 0 ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-300 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Deposit authorized and ready to capture</p>
                    <p className="text-sm opacity-90">Amount capturable: {formatCurrency((paymentInfo.amountCapturable || 0) / 100)}. Note: Card authorizations typically expire within ~7 days; capture before it expires.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Deposit not capturable</p>
                    <p className="text-sm opacity-90">Status: {paymentInfo.status || 'unknown'}{paymentInfo.latestChargeStatus ? ` · Latest charge: ${paymentInfo.latestChargeStatus}` : ''}</p>
                    <p className="text-sm opacity-90 mt-1">If the authorization expired or was canceled, you’ll need to re-authorize or initiate a new charge.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-tech font-bold text-white mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-neon-blue" />
                <span>Customer Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <p className="text-white">{booking.customer.firstName} {booking.customer.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <p className="text-white flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{booking.customer.email}</span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                  <p className="text-white flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{booking.customer.phone}</span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Driver's License</label>
                  <p className="text-white">{booking.customer.driversLicense}</p>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-tech font-bold text-white mb-4 flex items-center space-x-2">
                <Car className="w-5 h-5 text-neon-blue" />
                <span>Vehicle Information</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Vehicle</label>
                  <p className="text-white text-lg font-medium">
                    {booking.car.brand} {booking.car.model} ({booking.car.year})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Daily Rate</label>
                  <p className="text-white">{formatCurrency(booking.car.dailyPrice)}</p>
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-tech font-bold text-white mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-neon-blue" />
                <span>Rental Details</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                  <p className="text-white">{new Date(booking.rentalDates.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                  <p className="text-white">{new Date(booking.rentalDates.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
                  <p className="text-white">{booking.pricing.totalDays} days</p>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {booking.payment.additionalCharges && booking.payment.additionalCharges.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-tech font-bold text-white mb-4 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-neon-blue" />
                  <span>Additional Charges</span>
                </h2>
                
                <div className="space-y-3">
                  {booking.payment.additionalCharges.map((charge, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{charge.memo}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(charge.chargedAt).toLocaleDateString()} at {new Date(charge.chargedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-tech">{formatCurrency(charge.amount)}</p>
                        <p className={`text-xs ${charge.status === 'succeeded' ? 'text-green-400' : 'text-red-400'}`}>
                          {charge.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-tech font-bold text-white mb-4 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-neon-blue" />
                <span>Pricing Summary</span>
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">{formatCurrency(booking.pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax</span>
                  <span className="text-white">{formatCurrency(booking.pricing.finalAmount - booking.pricing.subtotal - (booking.pricing.additionalCharges || 0))}</span>
                </div>
                {(booking.pricing.additionalCharges || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Additional Charges</span>
                    <span className="text-white">{formatCurrency(booking.pricing.additionalCharges || 0)}</span>
                  </div>
                )}
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-medium">Total Amount</span>
                    <span className="text-white font-tech text-lg">{formatCurrency(booking.pricing.finalAmount)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Deposit (30%)</span>
                  <span className="text-white">{formatCurrency(booking.pricing.depositAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Remaining Balance</span>
                  <span className="text-white">{formatCurrency(booking.pricing.finalAmount - booking.pricing.depositAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-tech font-bold text-white mb-4">Payment Status</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Deposit</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.payment.depositStatus === 'captured' ? 'bg-green-400/10 text-green-400' :
                    booking.payment.depositStatus === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-red-400/10 text-red-400'
                  }`}>
                    {booking.payment.depositStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Final Payment</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.payment.finalPaymentStatus === 'succeeded' ? 'bg-green-400/10 text-green-400' :
                    booking.payment.finalPaymentStatus === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-red-400/10 text-red-400'
                  }`}>
                    {booking.payment.finalPaymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-tech font-bold text-white mb-4">Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-neon-blue text-black font-tech rounded-lg hover:bg-neon-blue/80 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Charge Customer</span>
                </button>
                
                <button
                  onClick={reauthorizeDeposit}
                  disabled={reauthLoading}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 bg-neon-blue text-black font-tech rounded-lg transition-colors ${reauthLoading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-neon-blue/80'}`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{reauthLoading ? 'Re-authorizing…' : 'Re-authorize Deposit'}</span>
                </button>

                <button
                  onClick={() => router.push(`/admin/bookings`)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white font-tech rounded-lg hover:bg-gray-500 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Bookings</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Charging Modal */}
        {showPricingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-tech font-bold text-white">Charge Customer</h3>
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">Charging:</p>
                  <p className="text-white font-medium">{booking.customer.firstName} {booking.customer.lastName}</p>
                  <p className="text-gray-400 text-sm">Booking ID: {booking.id.substring(0, 12)}...</p>
                </div>

                {/* Input Mode Toggle */}
                <div className="flex bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setAdjustmentMode('final')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      adjustmentMode === 'final'
                        ? 'bg-neon-blue text-black'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Set Final Amount
                  </button>
                  <button
                    onClick={() => setAdjustmentMode('adjustment')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      adjustmentMode === 'adjustment'
                        ? 'bg-neon-blue text-black'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Add/Subtract
                  </button>
                </div>

                {/* Amount Input */}
                {adjustmentMode === 'final' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Final Total Amount ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={finalAmount}
                      onChange={(e) => setFinalAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      placeholder="Enter final total amount"
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-400">
                        Current Total: {formatCurrency(booking.pricing.finalAmount)}
                      </p>
                      {finalAmount && !isNaN(parseFloat(finalAmount)) && (
                        <p className={`text-sm font-medium ${
                          parseFloat(finalAmount) - booking.pricing.finalAmount > 0 
                            ? 'text-green-400' 
                            : parseFloat(finalAmount) - booking.pricing.finalAmount < 0
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}>
                          {parseFloat(finalAmount) - booking.pricing.finalAmount > 0 && '+'}
                          {formatCurrency(parseFloat(finalAmount) - booking.pricing.finalAmount)} 
                          {parseFloat(finalAmount) - booking.pricing.finalAmount > 0 
                            ? ' additional charge' 
                            : parseFloat(finalAmount) - booking.pricing.finalAmount < 0
                            ? ' discount/refund'
                            : ' no change'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Adjustment Amount ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                      placeholder="Enter amount (positive for charges, negative for discounts)"
                    />
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-400">
                        Current Total: {formatCurrency(booking.pricing.finalAmount)}
                      </p>
                      {adjustmentAmount && !isNaN(parseFloat(adjustmentAmount)) && (
                        <p className="text-sm font-medium text-white">
                          New Total: {formatCurrency(booking.pricing.finalAmount + parseFloat(adjustmentAmount))}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description / Memo
                  </label>
                  <textarea
                    value={adjustmentMemo}
                    onChange={(e) => setAdjustmentMemo(e.target.value)}
                    placeholder="Reason for charge (e.g., damage fee, extra services, cleaning fee, discount)"
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none resize-none"
                  />
                </div>

                <div className="border border-gray-600 rounded-lg p-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={chargeNow}
                      onChange={(e) => setChargeNow(e.target.checked)}
                      className="w-4 h-4 text-neon-blue bg-dark-gray border-gray-600 rounded focus:ring-neon-blue focus:ring-2"
                    />
                    <div>
                      <span className="text-white font-medium">Charge customer's payment method now</span>
                      <p className="text-xs text-gray-400">
                        If unchecked, pricing will be updated but no payment will be processed
                      </p>
                    </div>
                  </label>
                </div>

                {(() => {
                  const calculatedAdjustment = adjustmentMode === 'final' 
                    ? (finalAmount && !isNaN(parseFloat(finalAmount)) ? parseFloat(finalAmount) - booking.pricing.finalAmount : 0)
                    : (adjustmentAmount && !isNaN(parseFloat(adjustmentAmount)) ? parseFloat(adjustmentAmount) : 0)
                  
                  if (chargeNow && calculatedAdjustment > 0) {
                    return (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                        <p className="text-yellow-400 text-sm">
                          ⚠️ This will charge {formatCurrency(calculatedAdjustment)} to the customer's saved payment method immediately.
                        </p>
                      </div>
                    )
                  } else if (chargeNow && calculatedAdjustment < 0) {
                    return (
                      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                        <p className="text-blue-400 text-sm">
                          ℹ️ This will process a {formatCurrency(Math.abs(calculatedAdjustment))} refund to the customer.
                        </p>
                      </div>
                    )
                  } else if (!chargeNow) {
                    return (
                      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                        <p className="text-blue-400 text-sm">
                          ℹ️ Pricing will be updated manually. No payment will be processed.
                        </p>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-lg hover:bg-gray-600/30 transition-colors"
                >
                  Cancel
                </button>
                        
                        if (chargeNow && calculatedAdjustment > 0) {
                          return (
                            <>
                              <CreditCard className="w-4 h-4" />
                              <span>Charge Customer</span>
                            </>
                          )
                        } else if (chargeNow && calculatedAdjustment < 0) {
                          return (
                            <>
                              <DollarSign className="w-4 h-4" />
                              <span>Process Refund</span>
                            </>
                          )
                        } else {
                          return (
                            <>
                              <Edit className="w-4 h-4" />
                              <span>Update Pricing</span>
                            </>
                          )
                        }
                      })()}
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
