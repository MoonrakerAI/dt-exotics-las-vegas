'use client'

import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Car } from '@/app/data/cars'

export default function ContactForm() {
  const [cars, setCars] = useState<Car[]>([])
  const [loadingCars, setLoadingCars] = useState(true)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    selectedCar: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    message: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    setLoadingCars(true)
    try {
      const response = await fetch('/api/cars?showOnHomepage=false') // Get all cars for contact form
      if (!response.ok) {
        throw new Error('Failed to fetch cars')
      }
      const data = await response.json()
      setCars(data.cars || [])
    } catch (err) {
      console.error('Error fetching cars:', err)
      // Set empty array on error, form will still work without car selection
      setCars([])
    } finally {
      setLoadingCars(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('Thank you for your inquiry! We\'ll contact you soon.')
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          selectedCar: '',
          startDate: null,
          endDate: null,
          message: ''
        })
      } else {
        alert('Something went wrong. Please try again or call us directly.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Something went wrong. Please try again or call us directly.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section className="py-20 px-4 relative bg-dark-metal/20" id="contact">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
            <span className="text-white">GET IN</span>{' '}
            <span className="neon-text">TOUCH</span>
          </h2>
          <p className="text-lg text-gray-400">
            Ready to elevate your Vegas experience? Send us a message and let's make it happen.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-tech font-bold text-white mb-6">READY TO BOOK?</h3>
              <p className="text-gray-300 mb-6">
                Skip the form and text us directly for instant responses. We're here to make your luxury car rental experience seamless.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-neon-blue/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">TEXT US</p>
                    <a href="sms:+17025180924" className="text-neon-blue hover:underline">
                      (702) 518-0924
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-neon-blue/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">EMAIL</p>
                    <a href="mailto:info@dtexoticslv.com" className="text-neon-blue hover:underline">
                      info@dtexoticslv.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-tech mb-2">NAME</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-metal-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-tech mb-2">EMAIL</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-metal-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-tech mb-2">PHONE</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-metal-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all"
                  placeholder="(702) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-tech mb-2">SELECT CAR</label>
                {loadingCars ? (
                  <div className="w-full px-4 py-3 bg-metal-gray rounded-lg text-gray-400">
                    Loading cars...
                  </div>
                ) : (
                  <select
                    name="selectedCar"
                    value={formData.selectedCar}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-metal-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all cursor-pointer"
                  >
                    <option value="">Choose your ride...</option>
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.model} - ${car.price.daily}/day
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date Pickers */}
              <div>
                <label className="block text-sm font-tech mb-2">PICKUP DATE</label>
                <DatePicker
                  selected={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
                  minDate={new Date()}
                  placeholderText="Select pickup date"
                  className="w-full px-4 py-3 bg-metal-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all cursor-pointer"
                  dateFormat="MM/dd/yyyy"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-tech mb-2">RETURN DATE</label>
                <DatePicker
                  selected={formData.endDate}
                  onChange={(date) => setFormData({ ...formData, endDate: date })}
                  minDate={formData.startDate || new Date()}
                  placeholderText="Select return date"
                  className="w-full px-4 py-3 bg-metal-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all cursor-pointer"
                  dateFormat="MM/dd/yyyy"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-tech mb-2">MESSAGE</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-metal-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all resize-none"
                  placeholder="Tell us about your Vegas plans..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}