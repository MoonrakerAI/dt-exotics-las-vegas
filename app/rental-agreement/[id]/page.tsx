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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RentalAgreementFormData, string>>>({})
  
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

  // Validation helpers
  const parseLocalDate = (value: string) => {
    if (!value) return null
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }

  const getAge = (dobStr: string) => {
    const dob = parseLocalDate(dobStr)
    if (!dob) return 0
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age
  }

  const isFutureDate = (dateStr: string) => {
    const d = parseLocalDate(dateStr)
    if (!d) return false
    const today = new Date()
    today.setHours(0,0,0,0)
    d.setHours(0,0,0,0)
    return d >= today
  }

  const timeRegex = /^([1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i

  const validateForm = (fd: RentalAgreementFormData) => {
    const errors: Partial<Record<keyof RentalAgreementFormData, string>> = {}

    if (!fd.fullName.trim()) errors.fullName = 'Full name is required'
    if (!fd.dateOfBirth) errors.dateOfBirth = 'Date of birth is required'
    else if (getAge(fd.dateOfBirth) < 25) errors.dateOfBirth = 'You must be at least 25 years old'

    if (!fd.driversLicenseNumber.trim()) errors.driversLicenseNumber = "Driver's license number is required"
    if (!/^[A-Z]{2}$/.test(fd.driversLicenseState.trim().toUpperCase())) errors.driversLicenseState = 'Use 2-letter state code (e.g., NV)'
    if (!fd.driversLicenseExpiry) errors.driversLicenseExpiry = 'License expiry is required'
    else if (!isFutureDate(fd.driversLicenseExpiry)) errors.driversLicenseExpiry = 'License must be valid on the rental date'

    if (!fd.street.trim()) errors.street = 'Street is required'
    if (!fd.city.trim()) errors.city = 'City is required'
    if (!/^[A-Z]{2}$/.test(fd.state.trim().toUpperCase())) errors.state = 'Use 2-letter state code'
    if (!/^\d{5}(-\d{4})?$/.test(fd.zipCode.trim())) errors.zipCode = 'Enter a valid ZIP (5 digits)'

    const digitsPhone = fd.emergencyContactPhone.replace(/\D/g, '')
    if (!digitsPhone) errors.emergencyContactPhone = 'Phone is required'
    else if (digitsPhone.length < 10 || digitsPhone.length > 15) errors.emergencyContactPhone = 'Enter a valid phone number'
    if (!fd.emergencyContactName.trim()) errors.emergencyContactName = 'Name is required'
    if (!fd.emergencyContactRelationship.trim()) errors.emergencyContactRelationship = 'Relationship is required'

    if (!timeRegex.test(fd.pickupTime)) errors.pickupTime = 'Use format h:mm AM/PM'
    if (!timeRegex.test(fd.returnTime)) errors.returnTime = 'Use format h:mm AM/PM'

    // All terms must be accepted
    const terms: (keyof RentalAgreementFormData)[] = [
      'ageRequirement','validLicense','insurance','noViolations','vehicleCondition','returnCondition','fuelPolicy','smokingPolicy','geographicLimits','modifications','liability','lateReturn'
    ]
    terms.forEach(t => { if (!fd[t]) errors[t] = 'Required' })

    if (!fd.signature) errors.signature = 'Signature is required'

    return errors
  }

  const setField = <K extends keyof RentalAgreementFormData>(key: K, rawValue: RentalAgreementFormData[K]) => {
    // Normalize some inputs safely without suppressing TS
    let newValue: RentalAgreementFormData[K] = rawValue
    if (key === 'driversLicenseState' || key === 'state') {
      const upper = String(rawValue).toUpperCase()
      newValue = upper as unknown as RentalAgreementFormData[K]
    }
    if (key === 'zipCode') {
      const cleanedZip = String(rawValue).replace(/[^\d-]/g, '')
      newValue = cleanedZip as unknown as RentalAgreementFormData[K]
    }
    if (key === 'emergencyContactPhone') {
      // keep digits and optional leading +
      const raw = String(rawValue)
      const cleaned = raw.replace(/[^\d+]/g, '')
      newValue = cleaned as unknown as RentalAgreementFormData[K]
    }
    setFormData(prev => ({ ...prev, [key]: newValue }))
    // clear error on change
    setFieldErrors(prev => ({ ...prev, [key]: undefined }))
  }

  // Signature canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set signature styling for better visibility
    ctx.strokeStyle = '#ffffff' // White color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
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
    const errors = validateForm(formData)
    setFieldErrors(errors)
    if (Object.values(errors).filter(Boolean).length > 0) {
      setError('Please correct the highlighted fields')
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
        <div className="bg-gray-800/60 backdrop-blur-md border border-gray-600/40 rounded-lg p-8 max-w-md w-full text-center">
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
        <div className="bg-gray-800/60 backdrop-blur-md border border-gray-600/40 rounded-lg p-8 max-w-md w-full text-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm border-b border-gray-600/30">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <img 
              src="/images/logo/dt-exotics-logo.png" 
              alt="DT Exotics Las Vegas" 
              className="h-16 mx-auto mb-4"
            />
            <p className="text-gray-200">Premium Supercar Rentals</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Agreement Header */}
        <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6 mb-8">
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
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.fullName && <p className="text-red-400 text-xs mt-1">{fieldErrors.fullName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setField('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{fieldErrors.dateOfBirth}</p>}
              </div>
            </div>
          </div>

          {/* Driver's License */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Driver's License</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  value={formData.driversLicenseNumber}
                  onChange={(e) => setField('driversLicenseNumber', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.driversLicenseNumber && <p className="text-red-400 text-xs mt-1">{fieldErrors.driversLicenseNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.driversLicenseState}
                  onChange={(e) => setField('driversLicenseState', e.target.value)}
                  placeholder="e.g., NV"
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.driversLicenseState && <p className="text-red-400 text-xs mt-1">{fieldErrors.driversLicenseState}</p>}
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
                  onChange={(e) => setField('driversLicenseExpiry', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.driversLicenseExpiry && <p className="text-red-400 text-xs mt-1">{fieldErrors.driversLicenseExpiry}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Street *</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setField('street', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.street && <p className="text-red-400 text-xs mt-1">{fieldErrors.street}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setField('city', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.city && <p className="text-red-400 text-xs mt-1">{fieldErrors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setField('state', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.state && <p className="text-red-400 text-xs mt-1">{fieldErrors.state}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">ZIP Code *</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setField('zipCode', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.zipCode && <p className="text-red-400 text-xs mt-1">{fieldErrors.zipCode}</p>}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setField('emergencyContactName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.emergencyContactName && <p className="text-red-400 text-xs mt-1">{fieldErrors.emergencyContactName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Relationship *</label>
                <input
                  type="text"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => setField('emergencyContactRelationship', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.emergencyContactRelationship && <p className="text-red-400 text-xs mt-1">{fieldErrors.emergencyContactRelationship}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setField('emergencyContactPhone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.emergencyContactPhone && <p className="text-red-400 text-xs mt-1">{fieldErrors.emergencyContactPhone}</p>}
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
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
                  onChange={(e) => setField('pickupTime', e.target.value)}
                  placeholder="e.g., 10:00 AM"
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.pickupTime && <p className="text-red-400 text-xs mt-1">{fieldErrors.pickupTime}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Return Time *</label>
                <input
                  type="text"
                  value={formData.returnTime}
                  onChange={(e) => setField('returnTime', e.target.value)}
                  placeholder="e.g., 10:00 AM"
                  className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  required
                />
                {fieldErrors.returnTime && <p className="text-red-400 text-xs mt-1">{fieldErrors.returnTime}</p>}
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
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
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
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

          {/* Legal Terms and Conditions */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-6">General Terms & Conditions</h3>
            
            <div className="space-y-6 text-gray-200 text-sm leading-relaxed">
              <div>
                <p className="mb-4">
                  This Terms & Conditions for the Car Rental Agreement (this "<strong>Agreement</strong>") is entered into and effective as of 
                  the "<strong>Effective Date</strong>" by and between DT EXOTICS LAS VEGAS, a Nevada entity with offices located at 
                  2687 S Sammy Davis Jr Dr, Las Vegas NV 89109 ("<strong>Owner</strong>"), and you (the "<strong>Renter</strong>") 
                  (each a "<strong>Party</strong>" and collectively the "<strong>Parties</strong>").
                </p>
                
                <p className="mb-4">
                  <strong>FOR MATTERS ARISING FROM THIS AGREEMENT, RENTER AUTHORIZES OWNER TO VERIFY AND/OR OBTAIN THROUGH CREDIT 
                  AGENCIES OR OTHER SOURCES RENTER'S PERSONAL, CREDIT AND/OR INSURANCE INFORMATION. THIS AGREEMENT IS THE 
                  ENTIRE AGREEMENT BETWEEN RENTER AND OWNER AND CANNOT BE ALTERED BY ANOTHER DOCUMENT OR ORAL 
                  AGREEMENT UNLESS AGREED TO IN WRITING AND SIGNED BY RENTER AND OWNER.</strong>
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">1. Definitions</h4>
                <p className="mb-2">For the purposes of this Agreement the following terms are specifically defined:</p>
                
                <div className="ml-4 space-y-2">
                  <p><strong>"Additional Authorized Driver(s)"</strong> or <strong>"AAD(s)"</strong> means any individual in addition to Renter who is permitted by Owner to operate Vehicle. This includes individuals identified in the Rental Agreement Summary as "<strong>ADDITIONAL AUTHORIZED DRIVER(S)</strong>", and with the permission of Renter, includes Renter's spouse or domestic partner (same or opposite sex) who meets the minimum rental age and holds a valid license.</p>
                  
                  <p><strong>"Optional Accessories"</strong> means but is not limited to optional child seats, global positioning systems, ski racks, toll transponders and/or other products accepted by Renter.</p>
                  
                  <p><strong>"Owner"</strong> for the purposes of this Agreement means "<strong>OWNER OF VEHICLE</strong>" shown on the top of the Rental Agreement Summary;</p>
                  
                  <p><strong>"Rental Period"</strong> means the period between the time Renter takes possession of Vehicle until Vehicle is returned or recovered and in either case, checked in by Owner.</p>
                  
                  <p><strong>"Renter"</strong> means the person, or entity identified on the Rental Agreement Summary as "<strong>RENTER</strong>";</p>
                  
                  <p><strong>"Vehicle"</strong> means the vehicle as listed in Section 2.1, or any replacement vehicle(s).</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">2. Ownership, Vehicle Condition, Renter Warranties, & Owner Warranty Exclusions</h4>
                
                <div className="space-y-3">
                  <div>
                    <p><strong>2.1.</strong> The Owner hereby agrees to rent the vehicle as described above.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.2.</strong> The Renter agrees to return the Vehicle in its current condition, notwithstanding other provisions in this Agreement, with <strong>FUEL AT THE SAME LEVEL AS WHEN TAKEN, WITH THE SAME TYPE OF GAS</strong>.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.3.</strong> The Renter acknowledges and agrees that the Vehicle is for use only in Clark County, Nevada, and cannot be taken elsewhere without prior written approval.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.4.</strong> The Renter represents and warrants that they have a legal and valid license to drive the Vehicle, and that there are no outstanding warrants against said license or Renter.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.5.</strong> The Renter further represents and warrants that they have insurance that will cover the operation of the Vehicle for its intended purpose, as well as comprehensive & collision insurance that applies to rental vehicles.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.6.</strong> The Renter warrants not to smoke in the Vehicle, and that smoking (whether cigarettes or other drugs) will result in loss of any deposits paid.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.7.</strong> The Renter acknowledges that Vehicle and any Optional Accessories are, by ownership, beneficial interest or lease, property of Owner or its affiliates, even if owned, registered or titled to a third party.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.8.</strong> The Renter acknowledges and agrees they inspected, or had the opportunity to inspect the Vehicle before the Rental Period begins, and confirms that the Vehicle is in good and operable condition.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.9.</strong> Renter is not an agent of Owner and has no authority to bind Owner.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.10.</strong> Renter agrees VEHICLE, INCLUDING ACCESSORIES, is in good physical and mechanical condition. <strong>RENTER IS TAKING POSSESSION OF VEHICLE AND ANY OPTIONAL ACCESSORIES "AS IS" AND HAS HAD AN ADEQUATE OPPORTUNITY TO INSPECT VEHICLE AND ANY OPTIONAL ACCESSORIES AND THEIR OPERATION. OWNER EXCLUDES ALL WARRANTIES, BOTH EXPRESS AND IMPLIED, WITH RESPECT TO THE VEHICLE AND ANY OPTIONAL ACCESSORIES, INCLUDING ANY IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE</strong>.</p>
                  </div>
                  
                  <div>
                    <p><strong>2.11.</strong> Renter agrees not to alter or tamper with Vehicle or any Optional Accessories. If Renter or AAD(s) determines Vehicle or any Optional Accessories is unsafe, Renter or AAD(s) shall stop operating Vehicle and any Optional Accessories and notify Owner immediately.</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">3. Payment by Renter</h4>
                
                <div className="space-y-3">
                  <div>
                    <p><strong>3.1.</strong> Unless expressly modified on the Rental Agreement Summary, all charges are for a minimum of 1 day.</p>
                  </div>
                  
                  <div>
                    <p><strong>3.2.</strong> Renter shall pay Owner, its affiliates or agents amounts as set forth on the Rental Agreement Summary for:</p>
                    
                    <div className="ml-4 space-y-2 mt-2">
                      <p><strong>a.</strong> The hour, day, week or month charges for the Rental Period. The "hour" charge if shown on the Rental Agreement Summary shall apply to each full or partial hour in excess of a day. The hourly charges shall not exceed the cost of an additional day. If the Vehicle is not returned by the time shown on the Branch Address on the Rental Agreement Summary, all rental charges incurred through the time an employee of Owner checks in Vehicle are Renter's responsibility;</p>
                      
                      <p><strong>b.</strong> The mileage charge per mile for all miles exceeding any free miles as set forth on the Rental Agreement Summary permitted for the Rental Period.</p>
                      
                      <p><strong>c.</strong> The Optional Accessories, services and/or products charges for those items accepted by Renter.</p>
                      
                      <p><strong>d.</strong> The fuel charge at the rate shown. If based on consumption and Vehicle is returned with less fuel than when rented, the charge shall be for the Owner's estimated difference in fuel level shown on the fuel gauge from the time Vehicle is rented to the time it is returned in addition to a fuel service fee. Owner's fuel gauge shall not receive a refund or credit if Vehicle is returned with more fuel than when Renter received it. If Renter purchases the Fuel Service Option, then Renter's fuel charge shall be the per gallon charge multiplied by the fuel tank capacity of Vehicle regardless of the actual fuel consumed.</p>
                      
                      <p><strong>e.</strong> The one way fee (for returning to a predetermined location other than the Branch Address on the Rental Agreement Summary), fees for AAD(s) and/or fees based on Renter or AAD(s) age.</p>
                    </div>
                  </div>
                  
                  <div>
                    <p><strong>3.3.</strong> The other fees and charges (none of which are taxes) including but not limited to:</p>
                    
                    <div className="ml-4 space-y-2 mt-2">
                      <p><strong>a. Fuel Charge.</strong></p>
                      
                      <div className="ml-4 space-y-2">
                        <p><strong>i.</strong> Under this Car Rental Agreement, if the Renter does not return the Vehicle with the gas tank full of the required type of fuel, the Renter agrees to a flat-rate fuel charge ("<strong>Fuel Charge</strong>"). The Fuel Charge is calculated based on the estimated average cost of fuel during the rental period and the anticipated time and distance that the rented vehicle will be driven, as well as the time taken by the Owner team to fuel the vehicle as well.</p>
                        
                        <p><strong>ii. Calculation of Fuel Charge.</strong> The Fuel Charge is calculated at the beginning of the rental period and is non-negotiable and non-refundable. The calculation is based on the vehicle's fuel efficiency, current market price of fuel, the rental duration, and the estimated mileage of use.</p>
                        
                        <p><strong>iii. Payment of Fuel Charge.</strong> The Fuel Charge is payable in advance at the beginning of the rental period, in addition to the rental fee and any other applicable charges or fees. If the Renter opts for the Fuel Service Option, the Renter is required to pay the Fuel Charge in full, regardless of the actual mileage driven or fuel consumed during the rental period.</p>
                      </div>
                      
                      <p><strong>b.</strong> Any charge, which is required to be paid by Owner or collected from Renter in connection with this rental, for the construction, financing, operation and/or maintenance of the consolidated rental facility, or for transportation related facilities.</p>
                      
                      <p><strong>c.</strong> A vehicle cost recovery fee which is Owner's charge to recover the estimated average per day cost incurred by the rental company to license, title, register, obtain mandatory insurance coverage for, and provide passenger motor vehicle and to pay any taxes owed on such vehicle. The Vehicle Cost Recovery Fee is not calculated based on the costs imposed upon a particular vehicle.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">7. Damage to, Loss, Modification or Theft of Vehicle</h4>
                <p className="mb-3">
                  Except to the extent restricted by State law, Renter accepts responsibility for damage to, loss, modification or theft of Vehicle, Optional Accessories regardless of fault or negligence. Renter shall pay Owner the amount necessary to repair Vehicle. Renter shall not have Vehicle repaired without permission from Owner. If Vehicle is stolen and not recovered or Owner determines Vehicle is salvage, Renter shall pay Owner the fair market value less any sale proceeds. Renter's responsibility includes but is not limited to: loss of use rental, diminished value, administrative and processing fees (estimated at $500.00), storage, impound and other charges. Damage estimate is less than $500, $100 if between $500 and $1499, and $150 if greater than $1500), diminishment of value (10% of the repair estimate if the damages are greater than $499). Renter agrees to pay any taxes, fees and other mandatory charges imposed by states, counties and other governmental and/or airport authorities.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">8. Responsibility to Third Parties</h4>
                <p className="mb-3">
                  Owner complies with applicable motor vehicle financial responsibility laws as an insured, state certified self-insurer, bondholder, or cash depositor. Owner does not extend any of its motor vehicle financial responsibility or provide insurance coverage to Renter, AAD(s), passengers or third parties through this Agreement. Owner's obligation is limited to the applicable state minimum financial responsibility amounts. Unless required by law, Owner's financial responsibility shall not extend to any claim made by a passenger of Renter or by anyone under any worker's compensation act.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">9. Indemnification by Renter</h4>
                <p className="mb-3">
                  Renter shall defend, indemnify and hold Owner harmless from all losses, liabilities, damages, injuries, claims, demands, costs, attorney fees and other expenses incurred by Owner in any manner from this rental transaction, or from the use of Vehicle or Optional Accessories by any person, including claims of or liabilities to, third parties.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">10. Personal Injury Protection and Uninsured/Underinsured Motorist Protection</h4>
                <p className="mb-3">
                  Except as required by law, Owner or its affiliate do not provide personal injury protection, no fault medical payments coverage, uninsured/underinsured motorist protection ("PIP") or ("UM" or "UIM") through this Agreement. If required by law to provide PIP and/or UM/UIM, Renter expressly selects such protection in the minimum limits with the maximum deductible and expressly waives and rejects PIP and/or UM/UIM limits in excess of the minimum limits required by law.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">11. Personal Property</h4>
                <p className="mb-3">
                  Owner is not responsible for any damage to, loss or theft of Renter's personal property or data contained therein. No bailment is created upon Owner for any personal property carried in or left in Vehicle or on Owner's premises. Failure to remove personal property from Vehicle within thirty (30) days after termination shall constitute abandonment of such property.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">12. Third Party Proceeds</h4>
                <p className="mb-3">
                  If a third party, including an insurance company, authorizes payment of any amount owed by Renter under this Agreement, Renter hereby assigns to Owner Renter's right to receive such payment. Only those amounts actually paid by a third party to Owner shall reduce the amount owed by Renter under this Agreement.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">13. Power of Attorney</h4>
                <p className="mb-2">Renter hereby grants and appoints to Owner a limited power of attorney:</p>
                <div className="ml-4 space-y-2">
                  <p><strong>a.</strong> to present insurance claims of any type to Renter's insurance carrier and/or credit card company if Vehicle is damaged, lost or stolen during the Rental Period and if Renter fails to pay for any damages; or any liability claims against Owner arise in connection with this rental transaction and Renter fails to defend, indemnify and hold Owner harmless from such claims.</p>
                  <p><strong>b.</strong> to endorse Renter's name to entitle Owner to receive insurance, credit card and/or debit card payments directly for any such claims, damages, liabilities or rental charges.</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">14. Severability</h4>
                <p className="mb-3">
                  If any provision of this Agreement is determined to be unlawful, contrary to public policy, void or unenforceable, all remaining provisions shall continue in full force and effect.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">15. Limitation of Remedy/No Consequential Damages</h4>
                <div className="space-y-3">
                  <p><strong>15.1.</strong> If Owner breaches any of its obligations under this Agreement and/or if Vehicle has any mechanical failure or other failure not caused by Renter or AAD(s) and if Owner is liable under applicable law, the sole remedy available to Renter and AAD(s) is limited to the substitution of another similar Vehicle by Owner to Renter and to recovery by Renter of the pro rata daily rental rate for the period in which Renter or AAD(s) cannot use Vehicle.</p>
                  <p><strong>15.2.</strong> RENTER AND AAD(s) WAIVE ALL CLAIMS FOR CONSEQUENTIAL, PUNITIVE, AND INCIDENTAL DAMAGES THAT MIGHT OTHERWISE BE AVAILABLE TO RENTER OR AAD(s). SUCH DAMAGES ARE EXCLUDED AND NOT AVAILABLE TO RENTER OR AAD(s). Renter further acknowledges that any personal or business information downloaded or transferred to Vehicle may not be secure and may be accessible after the Rental Period. Renter releases Owner from any liability resulting from or otherwise arising out of any such data or information being accessed and/or utilized by a third party.</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">16. Telematics Notice and Release</h4>
                <div className="space-y-3">
                  <p><strong>16.1.</strong> Vehicle may be equipped with or another vehicle telematics system (Telematics System). Some or all Telematics System functionality may or may not be active during the Rental Period and/or may be deactivated automatically and without warning or notice.</p>
                  <p><strong>16.2.</strong> Renter acknowledges that such systems utilize wireless technology to transmit data and, therefore, privacy cannot be guaranteed and is specifically disclaimed by Renter.</p>
                  <p><strong>16.3.</strong> Unless prohibited by law, Renter authorizes any person's use or disclosure of or access to (i.) location information, (ii.) automatic crash notification to any person for use in the operation of an automatic crash notification system, (iii) disable Vehicle and (iv.) operational condition, mileage, diagnostic data or performance reporting of Vehicle. Renter shall inform any and all AAD(s) and passengers of the terms of this section and that Renter has authorized use, disclosure or access as provided for herein.</p>
                  <p><strong>16.4.</strong> Renter releases Owner and agrees to indemnify, defend and hold harmless Owner, operator of the Telematics System, wireless carrier(s) and other suppliers of components or services of such telematics systems, officers, directors and employees from any damages (including, incidental and consequential damages) to persons (including without limitation Renter, an AAD(s) and passengers) or property caused by failure of the telematics system to operate properly or otherwise arising from the use of the Telematics System by an AAD or Owner.</p>
                  <p><strong>16.5.</strong> Use of the Telematics System is subject to the terms and conditions and privacy statement ("Telematics Terms") posted by the applicable Telematics System provider and/or vehicle manufacturer. The Telematics Terms are available at www.onstar.com), which may include system and service limitations, warranty exclusions, limitations of liability, wireless service provider terms, privacy practices, descriptions of use and sharing of data, and other terms and conditions governing the provision of such telematics services, in accordance with, and agrees to be bound by, the Telematics Terms. Third party service providers are not agents, employees, or contractors of Owner.</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">17. Headings</h4>
                <p className="mb-3">
                  The headings of the numbered paragraphs of this Agreement are for convenience only, are not part of this Agreement and do not in any way limit, modify or amplify the terms and conditions of this Agreement.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">18. Release of Information to Third Parties</h4>
                <p className="mb-3">
                  Renter agrees Owner may, and Renter expressly authorizes Owner, to provide information in Owner's possession about Renter and AAD(s), including but not limited to such driver's name, address, cellular/mobile and other phone numbers, driver's license and/or credit/debit card information to applicable authorities or other third parties, in connection with this Agreement including, without limitation, providing Renter's personal data to third parties which conduct services on Owner's behalf (such as consumer satisfaction surveys) and consent to Owner or Owner's representatives contacting Renter.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">19. Electronic Signatures and Legal Notices</h4>
                <div className="space-y-3">
                  <p><strong>19.1.</strong> Parties agree that any signature, electronic symbol or process attached to or associated with this Agreement with the intent to sign, authenticate or accept the terms of this Agreement will have the same legal validity and enforceability as a manually executed wet signature or use of a paper-based recordkeeping system to the fullest extent permitted by applicable law and without objection to the contrary.</p>
                  <p><strong>19.2.</strong> Parties consent to providing and receiving notices under this Agreement electronically and understand that this consent has the same legal effect as a physical signature. Parties may deliver notifications regarding activity and alerts electronically through Parties' emails, set forth below, or to any subsequent address designated by either Party, on notice to the other Party pursuant hereto, to receive information under this Agreement.</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">20. Choice of Law</h4>
                <p className="mb-3">
                  All terms and conditions of this Agreement shall be interpreted, construed and enforced pursuant to the laws of the State of Nevada without giving effect to the conflict of laws provisions of such State.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">21. Dispute Resolution</h4>
                <div className="space-y-3">
                  <p><strong>21.1.</strong> Any disputes, controversies, or differences arising out of or in connection with this contract, including any question regarding its existence, validity, or termination ("<strong>Disputes</strong>") shall be resolved as follows:</p>
                  <div className="ml-4 space-y-2">
                    <p><strong>a.</strong> First, by mutual negotiation between the Parties' senior representatives. In the event of a Party notifying the other of a Dispute, each Party shall designate a senior representative as Director or above, and the representative shall meet, whether physically or virtually, to attempt to resolve the Dispute in good faith.</p>
                    <p><strong>b.</strong> In the event mutual negotiation fails to resolve a Dispute within thirty (30) calendar days of the Dispute first arising, either Party may refer the Dispute for binding arbitration in Las Vegas, Nevada at the American Arbitration Association, Las Vegas Regional Office in accordance with its mediation rules for the time being in force (the "<strong>Mediation Rules</strong>") by a single mediator appointed in accordance with the Mediation Rules. In the event the Parties cannot agree to mediation, they shall record their Dispute through mediation, they shall record their settlement as a binding settlement contract that either Party may enforce to the recorded settlement per its terms.</p>
                    <p><strong>c.</strong> In the event mediation fails to resolve a Dispute within sixty (60) calendar days of the Parties' first meeting with a duly appointed mediator or attempt to resolve a Dispute through arbitration administered by the American Arbitration Association in accordance with the arbitration rules of American Arbitration Association ("<strong>Arbitration Rules</strong>") for the time being in force, which are deemed to be incorporated by reference into this clause. The seat of the arbitration shall be Las Vegas, Nevada. The tribunal shall consist of a single arbitrator. The language of the arbitration shall be English. Any settlement reached during the mediation shall be referred to the arbitral tribunal appointed by American Arbitration Association and may be made an agreed terms.</p>
                  </div>
                  <p><strong>21.2.</strong> Parties agree that services shall not be suspended pending the resolution of disputes. In the event of any Disputes relating to payments under this Agreement, the Company shall continue to pay undisputed amounts and may withhold only any disputed portion that is the subject of any ongoing basis.</p>
                  <p><strong>21.3.</strong> Each Party waives any objection to the laying of the venue of any legal action brought under or in connection with the subject matter of this Agreement under this Section 21, and agrees not to plead or claim in such courts that any such action has been brought in an inconvenient forum.</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">22. Clutch and Transmission</h4>
                <p className="mb-3">
                  Renter asserts they have received the vehicle with the clutch and transmission in good working condition. In the event there is any damage to the clutch or transmission, Renter agrees to pay DT EXOTICS LAS VEGAS for any and all costs incurred as a result of damage. Renter acknowledges the high temperatures in Nevada necessitate a cash deposit or via the credit card on file with DT EXOTICS LAS VEGAS. Renter acknowledges that damage to the clutch and/or transmission may not be apparent at the time the vehicle is returned due to the high temperature of the engine. Renter agrees to be notified of any damage incurred to the clutch or transmission after the vehicle has been returned.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">23. Loss of Use / Diminished Value</h4>
                <p className="mb-3">
                  Renter agrees to reimburse Owner for loss revenues for the inability of DT EXOTICS LAS VEGAS to rent the Vehicle due the default of the Renter or any damages caused by Renter. Loss revenue shall be calculated as the daily rental rate of the vehicle times the number of days the vehicle is out of use, due the fault of the Renter. Diminished value of the vehicle due to the fault of the Renter shall be calculated and added to the final settlement value. If Renter/Member's Insurance provider denies coverage of vehicle for any reason, the Renter can be held liable for three times the amount of the vehicle's market value.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">24. Indemnity of DT EXOTICS LAS VEGAS by Renter</h4>
                <p className="mb-3">
                  Neither DT EXOTICS LAS VEGAS nor any of its directors, officers, employees, servants or agents shall be liable for any loss or damage (including, without limitation, loss of or damage to property left or transported in the vehicle, any loss of life or any loss or damage arising from the installation or condition of a child seat or any other accessory in and/or on the vehicle), whether direct, consequential or otherwise arising and/or wherever nature) or the failure of DT EXOTICS LAS VEGAS to fulfill any of its obligations under this Agreement due to any cause whatsoever beyond its reasonable control or any defect, including negligence or gross negligence or otherwise which may be suffered by the Renter and/or any third party and/or passenger. DT EXOTICS LAS VEGAS is directors, officers, employees, servants or agents shall not be liable to indemnify the Renter or his/ her estate against any claim of any nature whatsoever and howsoever arising from any damages or loss which might be instituted against them arising from or connected with or pursuant to the renting of the vehicle contemplated in these terms and conditions.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">25. Procedure in the Event of an Accident Involving the Vehicle</h4>
                <p className="mb-3">
                  If at any time the vehicle is involved in an accident, damaged, Act of God, action that the Renter cannot reasonably control the interest of DT EXOTICS LAS VEGAS including but without being limited to, the following where appropriate, a failure to adhere to the latter will result in the Renter being liable for the Full Retail Total Loss. The Renter must contact DT EXOTICS LAS VEGAS within twenty-four hours of the occurrence and shall within twenty-four hours of the occurrence complete and furnish to DT EXOTICS LAS VEGAS, DT EXOTICS LAS VEGAS standard Accident Report form together with a copy of the Driver's License. The Renter shall obtain the names and addresses of all persons involved and all witnesses to any accident, theft, fire or other occurrence and the Renter shall furnish to DT EXOTICS LAS VEGAS a reference, case or docket number; The Renter shall make adequate provision for the safety and security of the vehicle and will not abandon it and will not permit it to be abandoned; The Renter shall not admit fault and circumstances of any claim or action and the defense of any action relating to any accident, theft, fire or other occurrence; inter alia filing an affidavit or giving evidence in court if he is requested to do so). If the Renter is not the Driver or Additional Driver, then, without in any way derogating from the Renter/Member's obligations in terms of this clause
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">26. Assignment of Insurance Benefits</h4>
                <p className="mb-3">
                  Renter hereby assigns any and all insurance rights, benefits, proceeds, and any causes of action under any applicable insurance policies to DT EXOTICS LAS VEGAS, for services rendered or to be rendered or losses sustained by Company. In this regard, Renter waives his/her privacy rights. Renter makes this assignment in consideration of DT EXOTICS LAS VEGAS agreement to perform services and supply Vehicle to Renter. Renter further also hereby directs his/her insurance carrier(s) to release any and all information requested by DT EXOTICS LAS VEGAS, its representative, and/or its Attorney for the direct purpose of obtaining Renter/Member's insurance coverage for any services rendered or to be rendered or losses sustained by DT EXOTICS LAS VEGAS or losses sustained by DT EXOTICS LAS VEGAS. Renter agrees that any position of services, deductibles, depreciation, loss of use, diminished value and all losses requested by the Renter. Renter also hereby authorizes and unequivocally instructs direct payment of any benefits or proceeds to DT EXOTICS LAS VEGAS.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">27. Odometer Tampering</h4>
                <p className="mb-3">
                  In determining the rental charges, the distance traveled by the vehicle shall be determined from the vehicle's odometer, or if this is not possible for any reason, by DT EXOTICS LAS VEGAS in its sole and absolute discretion, or any other fair and reasonable basis and the Renter shall be obliged to furnish all such information and assistance as DT EXOTICS LAS VEGAS may reasonably require for that purpose. If the odometer has been tampered with, then the miles traveled will be deemed to be 500 miles per day. The Renter shall also be liable for all fines, penalties and like expenses including but not limited to parking, traffic and other offenses, arising out of or concerning the use of the vehicle during the Rental Period and the Renter accordingly indemnifies DT EXOTICS LAS VEGAS against all such liability. The Renter shall also be liable for all attorney and client costs incurred by DT EXOTICS LAS VEGAS in instructing its attorneys to recover such outstanding expenses not paid by the Renter. All charges are subject to a 18% service / processing fee.
                </p>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-4">Digital Signature</h3>
            <p className="text-gray-300 text-sm mb-4">Use your mouse or touch to sign in the box below.</p>
            <div className="bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg p-4">
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
          <div className="bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-lg p-6">
            <h3 className="text-xl font-tech font-bold text-white mb-2">Special Instructions (Optional)</h3>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 bg-gray-700/60 backdrop-blur-sm border border-gray-500/40 rounded-lg text-white focus:border-neon-blue focus:outline-none resize-none"
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
