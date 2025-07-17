'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { cars } from '@/app/data/cars'

export default function ContactForm() {
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
    <section className="py-20 px-4 relative" id="contact">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
            <span className="text-white">READY TO</span>{' '}
            <span className="neon-text">RIDE?</span>
          </h2>
          <p className="text-xl text-gray-400">Book your supercar experience today</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div>
              <label className="block text-sm font-tech mb-2">NAME</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-metal-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all"
                placeholder="John Doe"
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
                placeholder="john@example.com"
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
          </div>

          {/* Message */}
          <div className="mt-6">
            <label className="block text-sm font-tech mb-2">MESSAGE (OPTIONAL)</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 bg-metal-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue transition-all resize-none"
              placeholder="Tell us about your dream driving experience..."
            />
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`btn-secondary min-w-[200px] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'SENDING...' : 'SUBMIT INQUIRY'}
            </button>
          </div>
        </form>

        {/* Contact Info */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="glass-panel bg-dark-metal/50 p-6 text-center group border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
              <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p className="font-tech text-sm mb-1">CALL US</p>
            <p className="text-gray-400">(702) 518-0924</p>
          </div>
          <div className="glass-panel bg-dark-metal/50 p-6 text-center group border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
              <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-tech text-sm mb-1">EMAIL US</p>
            <p className="text-gray-400">contact@dtexoticslv.com</p>
          </div>
          <div className="glass-panel bg-dark-metal/50 p-6 text-center group border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
              <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-tech text-sm mb-1">VISIT US</p>
            <p className="text-gray-400">Las Vegas, NV</p>
          </div>
        </div>
      </div>
    </section>
  )
}