'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { RentalAgreement, RentalAgreementFormData } from '@/app/types/rental-agreement'
import { RentalBooking } from '@/app/types/rental'
import { CheckCircle, AlertCircle, FileText, Clock, User, Car, Calendar } from 'lucide-react'

interface ClientAgreementData {
  agreement: RentalAgreement
  booking: RentalBooking
}

export default function RentalAgreementPage() {
  const params = useParams()
  const agreementId = params.id as string
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [agreementData, setAgreementData] = useState<ClientAgreementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<RentalAgreementFormData>({
    fullName: '',
    dateOfBirth: '',
    driversLicenseNumber: '',
    driversLicenseState: '',
    driversLicenseExpiry: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    pickupTime: '10:00 AM',
    returnTime: '10:00 AM',
    ageRequirement: false,
    validLicense: false,
    insurance: false,
    noViolations: false,
    vehicleCondition: false,
    returnCondition: false,
    fuelPolicy: false,
    smokingPolicy: false,
    geographicLimits: false,
    modifications: false,
    liability: false,
    lateReturn: false,
    signature: '',
    specialInstructions: ''
  })
  
  // Signature state
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureExists, setSignatureExists] = useState(false)

  useEffect(() => {
    if (agreementId) {
      fetchAgreement()
    }
  }, [agreementId])

  const fetchAgreement = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/rental-agreement/${agreementId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Rental agreement not found')
        } else if (response.status === 410) {
          throw new Error('This rental agreement has expired')
        }
        throw new Error('Failed to load rental agreement')
      }

      const data = await response.json()
      setAgreementData(data)
      
      // Pre-fill form with existing data
      if (data.agreement.agreementData) {
        setFormData(prev => ({
          ...prev,
          // Personal
          fullName: data.agreement.agreementData.fullName || `${data.booking.customer.firstName} ${data.booking.customer.lastName}`,
          dateOfBirth: data.agreement.agreementData.dateOfBirth || prev.dateOfBirth,
          // License
          driversLicenseNumber: data.agreement.agreementData.driversLicenseNumber || data.booking.customer.driversLicense || prev.driversLicenseNumber,
          driversLicenseState: data.agreement.agreementData.driversLicenseState || data.booking.customer.driversLicenseState || prev.driversLicenseState,
          driversLicenseExpiry: data.agreement.agreementData.driversLicenseExpiry || prev.driversLicenseExpiry,
          // Address
          street: data.agreement.agreementData.address?.street || prev.street,
          city: data.agreement.agreementData.address?.city || prev.city,
          state: data.agreement.agreementData.address?.state || prev.state,
          zipCode: data.agreement.agreementData.address?.zipCode || prev.zipCode,
          // Emergency Contact
          emergencyContactName: data.agreement.agreementData.emergencyContact?.name || prev.emergencyContactName,
          emergencyContactRelationship: data.agreement.agreementData.emergencyContact?.relationship || prev.emergencyContactRelationship,
          emergencyContactPhone: data.agreement.agreementData.emergencyContact?.phone || prev.emergencyContactPhone,
          // Times
          pickupTime: data.agreement.agreementData.rentalPeriod?.pickupTime || '10:00 AM',
          returnTime: data.agreement.agreementData.rentalPeriod?.returnTime || '10:00 AM',
          // Terms (preserve previously saved acknowledgments if any)
          ageRequirement: data.agreement.agreementData.termsAccepted?.ageRequirement || false,
          validLicense: data.agreement.agreementData.termsAccepted?.validLicense || false,
          insurance: data.agreement.agreementData.termsAccepted?.insurance || false,
          noViolations: data.agreement.agreementData.termsAccepted?.noViolations || false,
          vehicleCondition: data.agreement.agreementData.termsAccepted?.vehicleCondition || false,
          returnCondition: data.agreement.agreementData.termsAccepted?.returnCondition || false,
          fuelPolicy: data.agreement.agreementData.termsAccepted?.fuelPolicy || false,
          smokingPolicy: data.agreement.agreementData.termsAccepted?.smokingPolicy || false,
          geographicLimits: data.agreement.agreementData.termsAccepted?.geographicLimits || false,
          modifications: data.agreement.agreementData.termsAccepted?.modifications || false,
          liability: data.agreement.agreementData.termsAccepted?.liability || false,
          lateReturn: data.agreement.agreementData.termsAccepted?.lateReturn || false,
          // Other
          specialInstructions: data.agreement.agreementData.specialInstructions || prev.specialInstructions
        }))
      } else {
        // Minimal prefill from booking where appropriate
        setFormData(prev => ({
          ...prev,
          fullName: `${data.booking.customer.firstName} ${data.booking.customer.lastName}`,
          driversLicenseNumber: data.booking.customer.driversLicense || prev.driversLicenseNumber,
          driversLicenseState: data.booking.customer.driversLicenseState || prev.driversLicenseState,
          pickupTime: '10:00 AM',
          returnTime: '10:00 AM'
        }))
      }

    } catch (err) {
      console.error('Error fetching agreement:', err)
      setError(err instanceof Error ? err.message : 'Failed to load rental agreement')
    } finally {
      setLoading(false)
    }
  }

  // Signature canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
    setSignatureExists(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL()
      setFormData(prev => ({ ...prev, signature: dataUrl }))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureExists(false)
    setFormData(prev => ({ ...prev, signature: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const requiredFields = [
      'fullName', 'dateOfBirth', 'driversLicenseNumber', 'driversLicenseState',
      'driversLicenseExpiry', 'street', 'city', 'state', 'zipCode',
      'emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone'
    ]
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof RentalAgreementFormData])
    if (missingFields.length > 0) {
      setError('Please fill in all required fields')
      return
    }
    
    // Validate all terms accepted
    const termsFields = [
      'ageRequirement', 'validLicense', 'insurance', 'noViolations',
      'vehicleCondition', 'returnCondition', 'fuelPolicy', 'smokingPolicy',
      'geographicLimits', 'modifications', 'liability', 'lateReturn'
    ]
    
    const unacceptedTerms = termsFields.filter(field => !formData[field as keyof RentalAgreementFormData])
    if (unacceptedTerms.length > 0) {
      setError('You must accept all terms and conditions to proceed')
      return
    }
    
    if (!formData.signature) {
      setError('Digital signature is required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/rental-agreement/${agreementId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit agreement')
      }

      setSuccess(true)

    } catch (err) {
      console.error('Error submitting agreement:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit agreement')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto mb-4"></div>
          <p className="text-white">Loading rental agreement...</p>
        </div>
      </div>
    )
  }

  if (error && !agreementData) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-tech font-bold text-white mb-4">Agreement Not Available</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <a 
            href="/"
            className="inline-block bg-neon-blue text-black px-6 py-3 rounded-lg font-medium hover:bg-neon-blue/90 transition-colors"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-tech font-bold text-white mb-4">Agreement Completed!</h1>
          <p className="text-gray-300 mb-6">
            Your rental agreement has been successfully submitted and digitally signed. 
            We'll be in touch soon to finalize your rental details.
          </p>
          <a 
            href="/"
            className="inline-block bg-neon-blue text-black px-6 py-3 rounded-lg font-medium hover:bg-neon-blue/90 transition-colors"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    )
  }

  if (!agreementData) return null

  const { agreement, booking } = agreementData
  const expiryDate = new Date(agreement.expiresAt).toLocaleDateString()

  return (
    <div className="min-h-screen bg-dark-gray">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-tech font-bold text-neon-blue mb-2">
              DT EXOTICS LAS VEGAS
            </h1>
            <p className="text-gray-300">Premium Supercar Rentals</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Agreement Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-6 h-6 text-neon-blue" />
            <h2 className="text-2xl font-tech font-bold text-white">Rental Agreement</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Customer</p>
                <p className="text-white font-medium">{booking.customer.firstName} {booking.customer.lastName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Car className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Vehicle</p>
                <p className="text-white font-medium">{booking.car.year} {booking.car.brand} {booking.car.model}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-400">Expires</p>
                <p className="text-white font-medium">{expiryDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Driver's License */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Driver's License</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  value={formData.driversLicenseNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, driversLicenseNumber: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.driversLicenseState}
                  onChange={(e) => setFormData(prev => ({ ...prev, driversLicenseState: e.target.value }))}
                  placeholder="e.g., NV"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  License Expiry *
                </label>
                <input
                  type="date"
                  value={formData.driversLicenseExpiry}
                  onChange={(e) => setFormData(prev => ({ ...prev, driversLicenseExpiry: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Street *</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ZIP Code *</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Relationship *</label>
                <input
                  type="text"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactRelationship: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Rental Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pickup Date</label>
                <input
                  type="text"
                  readOnly
                  value={new Date(booking.rentalDates.startDate).toLocaleDateString()}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Return Date</label>
                <input
                  type="text"
                  readOnly
                  value={new Date(booking.rentalDates.endDate).toLocaleDateString()}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pickup Time *</label>
                <input
                  type="text"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickupTime: e.target.value }))}
                  placeholder="e.g., 10:00 AM"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Return Time *</label>
                <input
                  type="text"
                  value={formData.returnTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnTime: e.target.value }))}
                  placeholder="e.g., 10:00 AM"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Pricing Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <p><span className="text-gray-400">Daily Rate:</span> ${booking.pricing.dailyRate.toFixed(2)}</p>
              <p><span className="text-gray-400">Total Days:</span> {booking.pricing.totalDays}</p>
              <p><span className="text-gray-400">Subtotal:</span> ${booking.pricing.subtotal.toFixed(2)}</p>
              <p><span className="text-gray-400">Security Deposit:</span> ${booking.pricing.depositAmount.toFixed(2)}</p>
              <p className="md:col-span-2"><span className="text-gray-400">Total Amount:</span> ${booking.pricing.finalAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-tech font-bold text-white">Terms & Conditions</h3>
              <a href="/legal/rental-agreement.html" target="_blank" rel="noopener noreferrer" className="text-neon-blue text-sm hover:underline">
                View Full Legal Terms
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              {([
                ['ageRequirement','I am at least 25 years old'],
                ['validLicense','I have a valid driver\'s license'],
                ['insurance','I have adequate insurance coverage'],
                ['noViolations','I have no major violations in the past 3 years'],
                ['vehicleCondition','I accept the vehicle in its current condition'],
                ['returnCondition','I will return the vehicle in the same condition'],
                ['fuelPolicy','I will return with the same fuel level'],
                ['smokingPolicy','I acknowledge this is a non-smoking vehicle'],
                ['geographicLimits','I will stay within approved driving areas'],
                ['modifications','I will not modify the vehicle'],
                ['liability','I accept liability for damages according to the agreement'],
                ['lateReturn','I understand late return fees apply']
              ] as Array<[keyof RentalAgreementFormData, string]>).map(([key, label]) => (
                <label key={key as string} className="inline-flex items-start space-x-3 bg-gray-700/40 border border-gray-600/40 rounded-lg p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(formData[key])}
                    onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.checked }) as RentalAgreementFormData)}
                    className="mt-1 h-4 w-4 text-neon-blue border-gray-500 bg-gray-600 rounded"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Signature */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-4">Digital Signature</h3>
            <p className="text-gray-300 text-sm mb-4">Use your mouse or touch to sign in the box below.</p>
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                className="w-full h-48 bg-gray-900 rounded"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-400">Signature is required</p>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-3 py-2 text-sm bg-gray-600/40 border border-gray-600/60 text-gray-200 rounded hover:bg-gray-600/60"
                >
                  Clear Signature
                </button>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-2">Special Instructions (Optional)</h3>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none resize-none"
              placeholder="Any notes or requests you'd like us to know about"
            />
          </div>
          
          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={submitting}
              className="bg-neon-blue text-black px-8 py-4 rounded-lg font-tech font-bold text-lg hover:bg-neon-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Complete Agreement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
