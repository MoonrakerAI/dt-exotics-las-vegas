'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'
import { cars } from '../data/cars'
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
  
  const [formData, setFormData] = useState({
    carId: preselectedCarId || '',
    startDate: '',
    endDate: '',
    customer: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      driversLicense: ''
    }
  })
  
  const [pricing, setPricing] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedCar = cars.find(car => car.id === formData.carId)

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
        
        const updatedCar = cars.find(car => car.id === (field === 'carId' ? value : formData.carId));
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
    
    const { firstName, lastName, email, phone, driversLicense } = formData.customer
    if (!firstName || !lastName || !email || !phone || !driversLicense) {
      setError('Please fill in all customer information')
      return
    }

    // Ensure pricing is calculated before moving to step 3
    calculatePricing()
    setStep(3)
  }

  const createDepositIntent = async () => {
    setLoading(true)
    setError('')

    try {
      console.log('Creating deposit intent with data:', formData)
      
      const response = await fetch('/api/rentals/create-deposit-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      return data.data
    } catch (err) {
      console.error('Error creating deposit intent:', err)
      setError(err instanceof Error ? err.message : 'Failed to create booking')
      return null
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8 mb-8">
          <h2 className="text-2xl font-tech font-bold text-white mb-6">Select Your Rental</h2>
          
          <div className="space-y-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Car
              </label>
              <select
                value={formData.carId}
                onChange={(e) => handleInputChange('carId', e.target.value)}
                className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
              >
                <option value="">Choose a car...</option>
                {cars.map(car => (
                  <option key={car.id} value={car.id}>
                    {car.brand} {car.model} ({car.year}) - {formatCurrency(car.price.daily)}/day
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none cursor-pointer"
                    style={{ 
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield',
                      colorScheme: 'dark'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none cursor-pointer"
                    style={{ 
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield',
                      colorScheme: 'dark'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {selectedCar && (
            <div className="glass-panel p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={getCarImage(selectedCar)} 
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
                  <p className="text-gray-400">{selectedCar.year} • {selectedCar.category}</p>
                </div>
              </div>
              
              {pricing && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-gray-400 text-sm">Daily Rate</p>
                    <p className="text-white font-tech font-semibold">{formatCurrency(pricing.dailyRate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Days</p>
                    <p className="text-white font-tech font-semibold">{pricing.totalDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Deposit (30%)</p>
                    <p className="text-neon-blue font-tech font-semibold">{formatCurrency(pricing.depositAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total</p>
                    <p className="text-white font-tech font-semibold">{formatCurrency(pricing.subtotal)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleStepOne}
            disabled={!selectedCar || !formData.startDate || !formData.endDate}
            className="btn-primary w-full disabled:opacity-50"
          >
            Continue to Customer Information
          </button>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8 mb-8">
          <h2 className="text-2xl font-tech font-bold text-white mb-6">Customer Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.customer.firstName}
                onChange={(e) => handleInputChange('customer.firstName', e.target.value)}
                className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
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
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Driver's License Number
              </label>
              <input
                type="text"
                value={formData.customer.driversLicense}
                onChange={(e) => handleInputChange('customer.driversLicense', e.target.value)}
                className="w-full px-4 py-3 bg-dark-metal border border-gray-600 rounded-lg text-white focus:border-neon-blue focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
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

  return (
    <div className="max-w-4xl mx-auto">
      <Elements stripe={stripePromise}>
        <PaymentStep 
          formData={formData}
          pricing={pricing}
          onBack={() => setStep(2)}
          createDepositIntent={createDepositIntent}
        />
      </Elements>
    </div>
  )
}

function BookingForm() {
  return (
    <Suspense fallback={<div className="text-center py-12"><p className="text-gray-400">Loading...</p></div>}>
      <BookingFormInner />
    </Suspense>
  )
}

function PaymentStep({ formData, pricing, onBack, createDepositIntent }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [succeeded, setSucceeded] = useState(false)

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

  const selectedCar = cars.find(car => car.id === formData.carId)

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
      setProcessing(false)
      return
    }

    // Confirm the payment
    const result = await stripe.confirmCardPayment(intentData.paymentIntent.client_secret, {
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

  if (succeeded) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-tech font-bold text-white mb-4">Booking Confirmed!</h2>
        <p className="text-gray-400 mb-6">
          Your deposit has been processed and your rental is confirmed. You will receive a confirmation email shortly.
        </p>
        <a href="/" className="btn-primary inline-block">
          Return to Home
        </a>
      </div>
    )
  }

  return (
    <div className="glass-panel p-8 mb-8">
      <h2 className="text-2xl font-tech font-bold text-white mb-6">Secure Deposit Payment</h2>
      
      {/* Booking Summary */}
      <div className="glass-panel p-6 mb-6">
        <h3 className="text-lg font-tech font-semibold text-white mb-4">Booking Summary</h3>
        
        {/* Car Image and Details */}
        <div className="flex items-center gap-4 mb-6">
          <img 
            src={getCarImage(selectedCar)} 
            alt={`${selectedCar?.brand} ${selectedCar?.model}`}
            className="w-20 h-14 object-cover rounded-lg"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = '/cars/fallback/generic-car.jpg';
            }}
          />
          <div>
            <h4 className="text-white font-semibold text-lg">{selectedCar?.brand} {selectedCar?.model}</h4>
            <p className="text-gray-400 text-sm">{selectedCar?.year} • {selectedCar?.category}</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 text-sm">Rental Period</p>
            <p className="text-white font-semibold">
              {new Date(formData.startDate).toLocaleDateString()} - {new Date(formData.endDate).toLocaleDateString()}
            </p>
            <p className="text-gray-400 text-xs mt-1">{pricing ? `${pricing.totalDays} days` : '--'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Amount</p>
            <p className="text-white font-semibold">{pricing ? formatCurrency(pricing.subtotal) : '--'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Deposit Due Now</p>
            <p className="text-neon-blue font-semibold">{pricing ? formatCurrency(pricing.depositAmount) : '--'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Remaining Balance</p>
            <p className="text-white font-semibold">{pricing ? formatCurrency(pricing.finalAmount) : '--'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Information
          </label>
          <div className="p-4 border border-gray-600 rounded-lg bg-dark-metal">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-sm">
            <strong>Deposit Authorization:</strong> We'll authorize {pricing ? formatCurrency(pricing.depositAmount) : '$0'} on your card without charging it. 
            The remaining {pricing ? formatCurrency(pricing.finalAmount) : '$0'} will be charged at the end of your rental period.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex-1"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!stripe || processing}
            className={`flex-1 py-3 rounded-lg font-tech font-semibold transition-all duration-300 ${
              processing
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-neon-blue text-black hover:shadow-[0_0_30px_rgba(0,255,255,0.8)]'
            }`}
          >
            {processing ? 'Processing...' : `Authorize ${pricing ? formatCurrency(pricing.depositAmount) : '$0'} Deposit`}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function BookRentalPage() {
  return (
    <div className="min-h-screen bg-dark-gray">
      <Navbar />
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
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
      <Footer />
    </div>
  )
}