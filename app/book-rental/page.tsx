'use client'

import { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'
import CustomerCalendar from '../components/ui/CustomerCalendar'
import { Car } from '../data/cars'
import { stripePublishableKey } from '../lib/stripe'
import { formatCurrency, validateRentalDates } from '../lib/rental-utils'
import { getCarImage } from '../lib/image-utils'
import { CreateRentalRequest } from '../types/rental'

const stripePromise = loadStripe(stripePublishableKey).then(stripe => {
  if (!stripe) {
    console.error('Stripe failed to load. Check your publishable key:', stripePublishableKey);
  } else {
    console.log('Stripe loaded successfully with key:', stripePublishableKey);
  }
  return stripe;
})

function BookingFormInner() {
  const searchParams = useSearchParams()
  const preselectedCarId = searchParams.get('car')
  const customerInfoRef = useRef<HTMLDivElement | null>(null)
  
  const [cars, setCars] = useState<Car[]>([])
  const [availableCars, setAvailableCars] = useState<Car[]>([])
  const [loadingCars, setLoadingCars] = useState(true)
  const [carError, setCarError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    carId: preselectedCarId || '',
    startDate: '',
    endDate: '',
    promoCode: '',
    customer: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      driversLicense: '',
      driversLicenseState: ''
    }
  })
  
  const [pricing, setPricing] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Smooth scroll to customer info when moving to Step 2
  useEffect(() => {
    if (step === 2 && customerInfoRef.current) {
      try {
        // Scroll to top first to avoid partial viewport issues, then center the section
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Ensure DOM is painted before centering
        setTimeout(() => {
          try {
            customerInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          } catch {}
        }, 50)
      } catch (e) {
        // no-op if scroll fails
      }
    }
  }, [step])

  // Fetch all cars on component mount
  useEffect(() => {
    fetchAllCars()
  }, [])

  // Check availability when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      fetchAvailableCars(formData.startDate, formData.endDate)
    } else {
      setAvailableCars(cars)
    }
  }, [formData.startDate, formData.endDate, cars])

  const fetchAllCars = async () => {
    setLoadingCars(true)
    setCarError(null)
    try {
      const response = await fetch('/api/cars?showOnHomepage=false') // Get all cars for booking
      if (!response.ok) {
        throw new Error('Failed to fetch cars')
      }
      const data = await response.json()
      setCars(data.cars || [])
      setAvailableCars(data.cars || [])
    } catch (err) {
      console.error('Error fetching cars:', err)
      setCarError('Failed to load vehicles. Please try again later.')
    } finally {
      setLoadingCars(false)
    }
  }

  const fetchAvailableCars = async (startDate: string, endDate: string) => {
    try {
      const response = await fetch(`/api/cars?startDate=${startDate}&endDate=${endDate}&showOnHomepage=false`)
      if (!response.ok) {
        throw new Error('Failed to fetch available cars')
      }
      const data = await response.json()
      setAvailableCars(data.cars || [])
      
      // If currently selected car is not available, clear selection
      if (formData.carId && !data.cars.find((car: Car) => car.id === formData.carId)) {
        setFormData(prev => ({ ...prev, carId: '' }))
        setPricing(null)
      }
    } catch (err) {
      console.error('Error fetching available cars:', err)
      // Fall back to all cars if availability check fails
      setAvailableCars(cars)
    }
  }

  const selectedCar = availableCars.find(car => car.id === formData.carId)

  const calculatePricing = () => {
    console.log('Calculating pricing...', {
      selectedCar: selectedCar?.id,
      startDate: formData.startDate,
      endDate: formData.endDate
    })
    
    if (!selectedCar || !formData.startDate || !formData.endDate) {
      console.log('Missing data for pricing calculation')
      return
    }

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const timeDiff = end.getTime() - start.getTime()
    const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)))
    
    console.log('Date calculation:', { start, end, timeDiff, totalDays })
    
    if (totalDays > 0) {
      const subtotal = totalDays * selectedCar.price.daily
      const depositAmount = Math.round(subtotal * 0.30)
      const finalAmount = subtotal - depositAmount
      
      const newPricing = {
        dailyRate: selectedCar.price.daily,
        totalDays,
        subtotal,
        depositAmount,
        finalAmount
      }
      
      console.log('Setting pricing:', newPricing)
      setPricing(newPricing)
    }
  }

  // Calculate pricing when component mounts or when key values change
  useEffect(() => {
    if (selectedCar && formData.startDate && formData.endDate) {
      calculatePricing()
    }
  }, [selectedCar, formData.startDate, formData.endDate])

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('customer.')) {
      const customerField = field.replace('customer.', '')
      setFormData(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          [customerField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }

    // Calculate pricing after state update
    if (field === 'startDate' || field === 'endDate' || field === 'carId') {
      setTimeout(() => {
        const updatedFormData = { ...formData };
        if (field.startsWith('customer.')) {
          const customerField = field.replace('customer.', '');
          updatedFormData.customer = { ...updatedFormData.customer, [customerField]: value };
        } else {
          updatedFormData[field] = value;
        }
        
        const updatedCar = availableCars.find(car => car.id === (field === 'carId' ? value : formData.carId));
        if (updatedCar && updatedFormData.startDate && updatedFormData.endDate) {
          const start = new Date(updatedFormData.startDate);
          const end = new Date(updatedFormData.endDate);
          const timeDiff = end.getTime() - start.getTime();
          const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
          
          if (totalDays > 0) {
            const subtotal = totalDays * updatedCar.price.daily;
            const depositAmount = Math.round(subtotal * 0.30);
            const finalAmount = subtotal - depositAmount;
            
            const newPricing = {
              dailyRate: updatedCar.price.daily,
              totalDays,
              subtotal,
              depositAmount,
              finalAmount
            };
            
            console.log('Setting pricing:', newPricing);
            setPricing(newPricing);
          }
        }
      }, 50);
    }
  }

  const handleStepOne = () => {
    setError('')
    
    if (!formData.carId || !formData.startDate || !formData.endDate) {
      setError('Please select a car and dates')
      return
    }

    const dateValidation = validateRentalDates(formData.startDate, formData.endDate)
    if (!dateValidation.valid) {
      setError(dateValidation.error!)
      return
    }

    // Ensure pricing is calculated before moving to step 2
    calculatePricing()
    setStep(2)
  }

  const handleStepTwo = () => {
    setError('')
    
    const { firstName, lastName, email, phone, driversLicense, driversLicenseState } = formData.customer
    if (!firstName || !lastName || !email || !phone || !driversLicense || !driversLicenseState) {
      setError('Please fill in all customer information')
      return
    }

    // Ensure pricing is calculated before moving to step 3
    calculatePricing()
    setStep(3)
  }

  const updatePromoCode = (code: string) => {
    setFormData(prev => ({ ...prev, promoCode: code.trim().toUpperCase() }))
  }

  const createDepositIntent = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('Creating deposit intent with data:', formData)
      
      const response = await fetch('/api/rentals/create-deposit-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
        cache: 'no-store'
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      console.log('Response OK:', response.ok)

      // Handle different response types
      const contentType = response.headers.get('content-type')
      console.log('Response content-type:', contentType)

      let text = ''
      try {
        text = await response.text()
        console.log('Response text:', text)
      } catch (textError) {
        console.error('Failed to read response text:', textError)
        throw new Error('Failed to read server response')
      }

      // Try to parse as JSON
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        console.error('Raw response:', text)
        
        // Check if this might be an HTML error page
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          console.error('Received HTML instead of JSON - likely a 404 or server error page')
          throw new Error('Server routing error - API endpoint not found')
        }
        
        throw new Error('Invalid response format from server')
      }

      if (!response.ok) {
        console.error('Response not OK. Status:', response.status, 'Error:', data.error)
        throw new Error(data.error || `Failed with status ${response.status}`)
      }

      if (!data.success || !data.data) {
        console.error('Invalid response structure:', data)
        throw new Error(data.error || 'Invalid response structure')
      }

      console.log('Deposit intent created successfully:', data)
      setError('')
      return data.data
    } catch (err) {
      console.error('Error creating deposit intent:', err)
      setError(err instanceof Error ? err.message : 'Failed to create booking')
      return null
    } finally {
      setLoading(false)
    }
  }

  if (loadingCars) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mb-4"></div>
          <p className="text-gray-400">Loading available vehicles...</p>
        </div>
      </div>
    )
  }

  if (carError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{carError}</p>
          <button 
            onClick={fetchAllCars}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8 mb-8">
          <h2 className="text-2xl font-tech font-bold text-white mb-6">Select Your Rental</h2>
          
          <div className="space-y-6 mb-6">
            {/* Enhanced Calendar for Date Selection */}
            <CustomerCalendar
              selectedCarId={formData.carId}
              dailyRate={selectedCar?.price.daily}
              onDateRangeChange={(startDate, endDate) => {
                setFormData(prev => ({
                  ...prev,
                  startDate: startDate || '',
                  endDate: endDate || ''
                }))
              }}
              className="mb-6"
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Car
                {formData.startDate && formData.endDate && (
                  <span className="text-sm text-neon-blue ml-2">
                    (Showing {availableCars.length} available vehicle{availableCars.length !== 1 ? 's' : ''})
                  </span>
                )}
              </label>
              <select
                value={formData.carId}
                onChange={(e) => handleInputChange('carId', e.target.value)}
                className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
              >
                <option value="">Choose a car...</option>
                {availableCars.map(car => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} - {formatCurrency(car.price.daily)}/day
                  </option>
                ))}
              </select>
              
              {formData.startDate && formData.endDate && availableCars.length === 0 && (
                <p className="text-red-400 text-sm mt-2">
                  No vehicles available for the selected dates. Please choose different dates.
                </p>
              )}
            </div>
          </div>

          {selectedCar && (
            <div className="glass-panel p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={selectedCar ? getCarImage(selectedCar) : '/cars/fallback/generic-car.jpg'} 
                  alt={`${selectedCar.brand} ${selectedCar.model}`}
                  className="w-24 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    // Fallback to generic image if specific image fails
                    const img = e.target as HTMLImageElement;
                    img.src = '/cars/fallback/generic-car.jpg';
                  }}
                />
                <div>
                  <h3 className="text-xl font-tech font-bold text-white">
                    {selectedCar.brand} {selectedCar.model}
                  </h3>
                  <p className="text-gray-400">{selectedCar.category.charAt(0).toUpperCase() + selectedCar.category.slice(1)}</p>
                </div>
              </div>
              
              {pricing && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-neon-blue">{pricing.totalDays}</div>
                    <div className="text-sm text-gray-400">Days</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(pricing.dailyRate)}</div>
                    <div className="text-sm text-gray-400">Per Day</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(pricing.subtotal)}</div>
                    <div className="text-sm text-gray-400">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{formatCurrency(pricing.depositAmount)}</div>
                    <div className="text-sm text-gray-400">Deposit (30%)</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleStepOne}
            disabled={!formData.carId || !formData.startDate || !formData.endDate}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Customer Information
          </button>
        </div>
      </div>
    )
  }

  // Keep all other steps unchanged...
  // Step 2 and 3 remain the same as they were before

  if (step === 2) {
    return (
      <div className="max-w-4xl mx-auto">
        <div ref={customerInfoRef} className="glass-panel p-8 mb-8">
          <h2 className="text-2xl font-tech font-bold text-white mb-6">Customer Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.customer.firstName}
                onChange={(e) => handleInputChange('customer.firstName', e.target.value)}
                className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                placeholder="John"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.customer.lastName}
                onChange={(e) => handleInputChange('customer.lastName', e.target.value)}
                className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                placeholder="Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.customer.email}
                onChange={(e) => handleInputChange('customer.email', e.target.value)}
                className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.customer.phone}
                onChange={(e) => handleInputChange('customer.phone', e.target.value)}
                className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                placeholder="(702) 123-4567"
                required
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Driver's License Number
                </label>
                <input
                  type="text"
                  value={formData.customer.driversLicense}
                  onChange={(e) => handleInputChange('customer.driversLicense', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  placeholder="D1234567890123"
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.customer.driversLicenseState}
                  onChange={(e) => handleInputChange('customer.driversLicenseState', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
                  placeholder="NV"
                  maxLength={2}
                  style={{ textTransform: 'uppercase' }}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleStepTwo}
              className="btn-primary flex-1"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 3) {
  return (
        <PaymentStep 
          formData={formData}
          pricing={pricing}
          onBack={() => setStep(2)}
          createDepositIntent={createDepositIntent}
          updatePromoCode={updatePromoCode}
        />
  )
  }

  return null
}

function BookingForm() {
  return (
    <Suspense fallback={<div className="text-center py-12"><p className="text-gray-400">Loading...</p></div>}>
      <BookingFormInner />
    </Suspense>
  )
}

function PaymentStep({ formData, pricing, onBack, createDepositIntent, updatePromoCode }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [succeeded, setSucceeded] = useState(false)
  const [promoCodeInput, setPromoCodeInput] = useState<string>(formData.promoCode || '')
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoMessage, setPromoMessage] = useState<string>('')
  const [promoValid, setPromoValid] = useState<boolean>(!!formData.promoCode)
  const [promoDetails, setPromoDetails] = useState<any | null>(null)

  console.log('PaymentStep received pricing:', pricing)

  // Check if Stripe and Elements are loaded
  if (!stripe || !elements) {
    return (
      <div className="glass-panel p-8 mb-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue mb-4"></div>
          <p className="text-gray-400">Loading secure payment form...</p>
          <p className="text-red-400 text-sm mt-2">
            If this persists, check if Stripe keys are configured in environment variables
          </p>
        </div>
      </div>
    )
  }

  const selectedCar = formData.carId ? { id: formData.carId } : null // Simplified for payment step

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError('')

    // Create the deposit intent
    const intentData = await createDepositIntent()
    if (!intentData) {
      // Surface a helpful error when the API call fails upstream
      setError('Unable to create deposit. Please verify your details and selected dates, then try again. If this persists, check that payment is configured and that the car is available for the selected dates.')
      setProcessing(false)
      return
    }

    // Confirm the payment
    const result = await stripe.confirmCardPayment(intentData.clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
        billing_details: {
          name: `${formData.customer.firstName} ${formData.customer.lastName}`,
          email: formData.customer.email,
          phone: formData.customer.phone,
        },
      },
    })

    if (result.error) {
      setError(result.error.message || 'Payment failed')
      setProcessing(false)
    } else {
      setSucceeded(true)
      setProcessing(false)
    }
  }

  const handleValidatePromo = async () => {
    const code = (promoCodeInput || '').trim().toUpperCase()
    if (!code) {
      setPromoValid(false)
      setPromoMessage('Enter a code to validate')
      setPromoDetails(null)
      return
    }
    setPromoLoading(true)
    setPromoMessage('')
    setPromoValid(false)
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.valid) {
        setPromoValid(false)
        setPromoMessage(data.error || 'Invalid or expired code')
        setPromoDetails(null)
        updatePromoCode('')
      } else {
        setPromoValid(true)
        updatePromoCode(code)
        setPromoDetails(data)
        const details: string[] = []
        if (typeof data.percentOff === 'number') details.push(`${data.percentOff}% off`)
        if (typeof data.amountOff === 'number') details.push(`$${data.amountOff.toFixed(2)} off`)
        if (data.partnerName) details.push(`Partner: ${data.partnerName}`)
        setPromoMessage(details.join(' • ') || 'Code applied')
      }
    } catch (e) {
      setPromoValid(false)
      setPromoMessage('Failed to validate code')
      setPromoDetails(null)
      updatePromoCode('')
    } finally {
      setPromoLoading(false)
    }
  }

  const estimatedDepositAfterPromo = useMemo(() => {
    if (!pricing || !promoValid || !promoDetails) return null
    const base = Number(pricing.depositAmount) || 0
    let est = base
    if (typeof promoDetails.percentOff === 'number') {
      est = base * (1 - promoDetails.percentOff / 100)
    } else if (typeof promoDetails.amountOff === 'number') {
      est = base - promoDetails.amountOff
    }
    if (!isFinite(est)) return null
    return Math.max(0, est)
  }, [pricing, promoValid, promoDetails])

  if (succeeded) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-tech font-bold text-white mb-4">Booking Request Received!</h2>
          <p className="text-gray-400 mb-6">
            Your booking request has been received and your deposit has been authorized. We will confirm availability and finalize your reservation within 24 hours. You'll receive a confirmation email shortly with all the details.
          </p>
          <a href="/" className="btn-primary inline-block">
            Return to Homepage
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
    <div className="glass-panel p-8 mb-8">
        <h2 className="text-2xl font-tech font-bold text-white mb-6">Payment Information</h2>
      
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Promotion Code (optional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value)}
              placeholder="ENTER CODE"
              className="flex-1 px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none uppercase"
            />
            <button
              type="button"
              onClick={handleValidatePromo}
              disabled={promoLoading}
              className="btn-secondary whitespace-nowrap"
            >
              {promoLoading ? 'Checking...' : 'Apply'}
            </button>
          </div>
          {promoMessage && (
            <p className={`text-sm mt-2 ${promoValid ? 'text-green-400' : 'text-red-400'}`}>{promoMessage}</p>
          )}
        </div>
      
        {pricing && (
          <div className="bg-dark-metal/30 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-tech font-semibold text-white mb-4">Booking Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Rate:</span>
                <span className="text-white">{formatCurrency(pricing.dailyRate)}</span>
          </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Days:</span>
                <span className="text-white">{pricing.totalDays}</span>
        </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal:</span>
                <span className="text-white">{formatCurrency(pricing.subtotal)}</span>
          </div>
              <div className="border-t border-gray-600 pt-2 mt-2">
                <div className="flex justify-between text-lg">
                  <span className="text-white font-semibold">Deposit (30%):</span>
                  <span className="text-yellow-400 font-bold">{formatCurrency(pricing.depositAmount)}</span>
          </div>
                {estimatedDepositAfterPromo != null && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-green-400">Estimated deposit after promo:</span>
                    <span className="text-green-300 font-medium">{formatCurrency(estimatedDepositAfterPromo)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Remaining balance due at pickup:</span>
                  <span className="text-gray-300">{formatCurrency(pricing.finalAmount)}</span>
          </div>
          </div>
        </div>
      </div>
        )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Information
          </label>
            <div className="bg-dark-metal border border-gray-600 rounded-lg p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    '::placeholder': {
                        color: '#6b7280',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
              disabled={processing}
            className="btn-secondary flex-1"
          >
            Back
          </button>
          <button
            type="submit"
              disabled={processing || !stripe}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {processing ? 'Processing...' : `Pay Deposit ${pricing ? formatCurrency(pricing.depositAmount) : ''}`}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default function BookRentalPage() {
  return (
    <div className="min-h-screen bg-dark-gray flex flex-col">
      <Navbar />
      <Elements stripe={stripePromise}>
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-tech font-bold text-white mb-4">
                Book Your <span className="neon-text">Rental</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Secure your dream car with our streamlined booking process
              </p>
            </div>

            <BookingForm />
          </div>
        </div>
      </Elements>
      <Footer />
    </div>
  )
}