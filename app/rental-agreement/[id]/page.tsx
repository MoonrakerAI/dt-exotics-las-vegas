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
          fullName: data.agreement.agreementData.fullName || `${data.booking.customer.firstName} ${data.booking.customer.lastName}`,
          driversLicenseNumber: data.agreement.agreementData.driversLicenseNumber || data.booking.customer.driversLicense,
          pickupTime: data.agreement.agreementData.rentalPeriod?.pickupTime || '10:00 AM',
          returnTime: data.agreement.agreementData.rentalPeriod?.returnTime || '10:00 AM'
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

          {/* Continue with more form sections... */}
          
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
