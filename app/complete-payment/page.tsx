'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'
import { stripePublishableKey } from '../lib/stripe'

const stripePromise = loadStripe(stripePublishableKey)

function PaymentForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError('')

    const result = await stripe.confirmCardPayment(clientSecret)

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
        <h2 className="text-2xl font-tech font-bold text-white mb-4">Payment Completed!</h2>
        <p className="text-gray-400 mb-6">
          Your payment has been processed successfully. You will receive a confirmation email shortly.
        </p>
        <a href="/" className="btn-primary inline-block">
          Return to Home
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-xl font-tech font-bold text-white mb-4">Complete Your Payment</h2>
        <p className="text-gray-400 mb-6">
          Please confirm your payment method to complete the rental process.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Card Information
          </label>
          <div className="p-3 border border-gray-600 rounded-lg bg-dark-metal">
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

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || processing}
          className={`w-full py-3 rounded-lg font-tech font-semibold transition-all duration-300 ${
            processing
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-neon-blue text-black hover:shadow-[0_0_30px_rgba(0,255,255,0.8)]'
          }`}
        >
          {processing ? 'Processing...' : 'Complete Payment'}
        </button>
      </div>
    </form>
  )
}

export default function CompletePaymentPage() {
  const searchParams = useSearchParams()
  const clientSecret = searchParams.get('pi')

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-dark-gray">
        <Navbar />
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-tech font-bold text-white mb-4">Invalid Payment Link</h1>
            <p className="text-gray-400 mb-8">
              The payment link you used is invalid or has expired.
            </p>
            <a href="/" className="btn-primary inline-block">
              Return to Home
            </a>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-gray">
      <Navbar />
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-tech font-bold text-white mb-4">
              Complete Your <span className="neon-text">Payment</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Secure payment processing for your luxury car rental
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm clientSecret={clientSecret} />
          </Elements>
        </div>
      </div>
      <Footer />
    </div>
  )
}