'use client'

import { useState } from 'react'
import { Send, CheckCircle, AlertTriangle, User, Mail, Phone, Calendar, Users, MapPin, Car, MessageSquare, TrendingUp } from 'lucide-react'

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'number'
  required?: boolean
  placeholder?: string
  options?: string[]
  icon?: React.ReactNode
}

interface EventContactFormProps {
  eventType: string
  title: string
  subtitle: string
  fields: FormField[]
  submitButtonText?: string
  successMessage?: string
}

export default function EventContactForm({
  eventType,
  title,
  subtitle,
  fields,
  submitButtonText = "SEND INQUIRY",
  successMessage = "Thank you! We'll contact you within 24 hours to plan your amazing experience."
}: EventContactFormProps) {
  const [formData, setFormData] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          formData,
          timestamp: new Date().toISOString()
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({}) // Reset form
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send inquiry')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send inquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const commonClasses = "w-full px-4 py-3 bg-dark-gray border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none transition-colors"
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            key={field.name}
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={`${commonClasses} h-24 resize-none`}
            rows={4}
          />
        )
      
      case 'select':
        return (
          <select
            key={field.name}
            name={field.name}
            required={field.required}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={commonClasses}
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      
      default:
        return (
          <input
            key={field.name}
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={commonClasses}
          />
        )
    }
  }

  if (submitStatus === 'success') {
    return (
      <section id="contact" className="py-20 px-4 relative">
        <div className="max-w-[800px] mx-auto">
          <div className="glass-panel bg-dark-metal/50 p-12 border border-gray-600/30 rounded-2xl text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-tech font-black text-white mb-4">
              INQUIRY SENT!
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              {successMessage}
            </p>
            <button
              onClick={() => setSubmitStatus('idle')}
              className="btn-secondary"
            >
              SEND ANOTHER INQUIRY
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="contact" className="py-20 px-4 relative">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
            <span className="text-white">{title.split(' ').slice(0, -1).join(' ')}</span>{' '}
            <span className="neon-text">{title.split(' ').slice(-1)[0]}</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="glass-panel bg-dark-metal/50 p-8 md:p-12 border border-gray-600/30 rounded-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <div className="flex items-center space-x-2">
                      {field.icon}
                      <span>{field.label} {field.required && <span className="text-neon-blue">*</span>}</span>
                    </div>
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            {submitStatus === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 text-sm">
                    <strong>Error:</strong> {errorMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="text-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    <span>SENDING...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>{submitButtonText}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-600/30 text-center">
            <p className="text-gray-400 text-sm mb-4">
              Prefer to talk directly? We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+17025180924" 
                className="text-neon-blue hover:text-neon-blue/80 transition-colors font-medium"
              >
                📞 (702) 518-0924
              </a>
              <a 
                href="sms:+17025180924" 
                className="text-neon-blue hover:text-neon-blue/80 transition-colors font-medium"
              >
                💬 Text Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Export common form field configurations for different event types
export const getFormFields = (eventType: string): FormField[] => {
  const commonFields: FormField[] = [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Your full name',
      icon: <User className="w-4 h-4" />
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'your@email.com',
      icon: <Mail className="w-4 h-4" />
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: true,
      placeholder: '(702) 555-0123',
      icon: <Phone className="w-4 h-4" />
    }
  ]

  switch (eventType) {
    case 'bachelor-party':
      return [
        ...commonFields,
        {
          name: 'eventDate',
          label: 'Event Date',
          type: 'date',
          required: true,
          icon: <Calendar className="w-4 h-4" />
        },
        {
          name: 'groupSize',
          label: 'Group Size',
          type: 'number',
          required: true,
          placeholder: 'How many people?',
          icon: <Users className="w-4 h-4" />
        },
        {
          name: 'preferredVehicles',
          label: 'Preferred Vehicles',
          type: 'select',
          placeholder: 'Select vehicle preference',
          options: ['Lamborghini', 'Ferrari', 'McLaren', 'Porsche', 'Multiple Vehicles', 'No Preference'],
          icon: <Car className="w-4 h-4" />
        },
        {
          name: 'venueInterests',
          label: 'Venue Interests',
          type: 'select',
          placeholder: 'What venues interest you?',
          options: ['Nightclubs', 'Strip Clubs', 'Restaurants', 'Golf Courses', 'Shooting Ranges', 'Multiple Venues'],
          icon: <MapPin className="w-4 h-4" />
        },
        {
          name: 'budget',
          label: 'Estimated Budget',
          type: 'select',
          placeholder: 'Select budget range',
          options: ['$1,000 - $2,500', '$2,500 - $5,000', '$5,000 - $10,000', '$10,000+'],
          icon: <MessageSquare className="w-4 h-4" />
        },
        {
          name: 'additionalDetails',
          label: 'Additional Details',
          type: 'textarea',
          placeholder: 'Tell us about any special requests, the groom\'s interests, or anything else we should know...',
          icon: <MessageSquare className="w-4 h-4" />
        }
      ]

    case 'birthday':
      return [
        ...commonFields,
        {
          name: 'eventDate',
          label: 'Birthday Date',
          type: 'date',
          required: true,
          icon: <Calendar className="w-4 h-4" />
        },
        {
          name: 'age',
          label: 'Age Celebrating',
          type: 'number',
          required: true,
          placeholder: 'What age are you celebrating?',
          icon: <Users className="w-4 h-4" />
        },
        {
          name: 'groupSize',
          label: 'Group Size',
          type: 'number',
          placeholder: 'How many people total?',
          icon: <Users className="w-4 h-4" />
        },
        {
          name: 'preferredVehicles',
          label: 'Dream Car',
          type: 'select',
          placeholder: 'Which car would make your day?',
          options: ['Lamborghini', 'Ferrari', 'McLaren', 'Porsche', 'Rolls Royce', 'Surprise Me!'],
          icon: <Car className="w-4 h-4" />
        },
        {
          name: 'experienceType',
          label: 'Experience Type',
          type: 'select',
          placeholder: 'What kind of birthday experience?',
          options: ['Photo Shoot Focus', 'Driving Experience', 'Social Media Content', 'Surprise Party', 'Dinner & Driving'],
          icon: <MapPin className="w-4 h-4" />
        },
        {
          name: 'budget',
          label: 'Budget Range',
          type: 'select',
          placeholder: 'Select budget range',
          options: ['$500 - $1,500', '$1,500 - $3,000', '$3,000 - $5,000', '$5,000+'],
          icon: <MessageSquare className="w-4 h-4" />
        },
        {
          name: 'additionalDetails',
          label: 'Special Requests',
          type: 'textarea',
          placeholder: 'Any special requests, favorite colors, social media goals, or other details...',
          icon: <MessageSquare className="w-4 h-4" />
        }
      ]

    case 'corporate':
      return [
        ...commonFields,
        {
          name: 'company',
          label: 'Company Name',
          type: 'text',
          required: true,
          placeholder: 'Your company name',
          icon: <User className="w-4 h-4" />
        },
        {
          name: 'eventDate',
          label: 'Event Date',
          type: 'date',
          required: true,
          icon: <Calendar className="w-4 h-4" />
        },
        {
          name: 'eventType',
          label: 'Event Type',
          type: 'select',
          required: true,
          placeholder: 'Select event type',
          options: ['Team Building', 'Client Entertainment', 'Product Launch', 'Corporate Retreat', 'Executive Experience', 'Trade Show'],
          icon: <Users className="w-4 h-4" />
        },
        {
          name: 'attendeeCount',
          label: 'Number of Attendees',
          type: 'number',
          required: true,
          placeholder: 'How many attendees?',
          icon: <Users className="w-4 h-4" />
        },
        {
          name: 'vehicleNeeds',
          label: 'Vehicle Requirements',
          type: 'select',
          placeholder: 'What vehicles do you need?',
          options: ['Single Luxury Vehicle', 'Multiple Vehicles', 'Fleet Experience', 'VIP Transportation', 'Photo/Video Props'],
          icon: <Car className="w-4 h-4" />
        },
        {
          name: 'budget',
          label: 'Budget Range',
          type: 'select',
          placeholder: 'Select budget range',
          options: ['$2,500 - $5,000', '$5,000 - $10,000', '$10,000 - $25,000', '$25,000+'],
          icon: <MessageSquare className="w-4 h-4" />
        },
        {
          name: 'additionalDetails',
          label: 'Event Details',
          type: 'textarea',
          placeholder: 'Tell us about your event goals, VIP requirements, branding needs, or special requests...',
          icon: <MessageSquare className="w-4 h-4" />
        }
      ]

    case 'vip-services':
      return [
        ...commonFields,
        {
          name: 'serviceDate',
          label: 'Service Date',
          type: 'date',
          required: true,
          icon: <Calendar className="w-4 h-4" />
        },
        {
          name: 'serviceType',
          label: 'VIP Service Type',
          type: 'select',
          required: true,
          placeholder: 'Select service type',
          options: ['Airport Transfer', 'Event Transportation', 'Date Night', 'Business Meeting', 'Special Occasion', 'Multi-Day Experience'],
          icon: <MapPin className="w-4 h-4" />
        },
        {
          name: 'partySize',
          label: 'Party Size',
          type: 'number',
          required: true,
          placeholder: 'How many people?',
          icon: <Users className="w-4 h-4" />
        },
        {
          name: 'vehiclePreference',
          label: 'Vehicle Preference',
          type: 'select',
          placeholder: 'Select vehicle preference',
          options: ['Rolls Royce', 'Bentley', 'Lamborghini', 'Ferrari', 'McLaren', 'Luxury SUV', 'Your Choice'],
          icon: <Car className="w-4 h-4" />
        },
        {
          name: 'destinations',
          label: 'Destinations/Venues',
          type: 'select',
          placeholder: 'Select destination type',
          options: ['Fine Dining Restaurants', 'Luxury Hotels', 'Nightclubs/Lounges', 'Shopping Centers', 'Entertainment Venues', 'Business Meetings', 'Multiple Destinations'],
          icon: <MapPin className="w-4 h-4" />
        },
        {
          name: 'budget',
          label: 'Budget Range',
          type: 'select',
          placeholder: 'Select budget range',
          options: ['$1,000 - $2,500', '$2,500 - $5,000', '$5,000 - $10,000', '$10,000+'],
          icon: <MessageSquare className="w-4 h-4" />
        },
        {
          name: 'additionalDetails',
          label: 'Special Requirements',
          type: 'textarea',
          placeholder: 'Any special requests, preferences, or VIP requirements...',
          icon: <MessageSquare className="w-4 h-4" />
        }
      ]

    case 'partners':
      return [
        ...commonFields,
        {
          name: 'company',
          label: 'Company/Organization',
          type: 'text',
          required: true,
          placeholder: 'Your company or organization name',
          icon: <User className="w-4 h-4" />
        },
        {
          name: 'clientVolume',
          label: 'Expected Client Volume',
          type: 'select',
          required: true,
          placeholder: 'How many referrals per month?',
          options: ['1-5 clients/month', '5-15 clients/month', '15-30 clients/month', '30+ clients/month'],
          icon: <Users className="w-4 h-4" />
        },
        {
          name: 'desiredClientVolume',
          label: 'Desired Client Volume',
          type: 'select',
          placeholder: 'What volume are you targeting?',
          options: ['5-10 clients/month', '10-25 clients/month', '25-50 clients/month', '50+ clients/month'],
          icon: <TrendingUp className="w-4 h-4" />
        },
        {
          name: 'partnershipGoals',
          label: 'Partnership Goals',
          type: 'textarea',
          placeholder: 'What are you hoping to achieve through this partnership? How can we work together?',
          icon: <MessageSquare className="w-4 h-4" />
        }
      ]

    default:
      return commonFields
  }
}
