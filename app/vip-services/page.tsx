'use client'

import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'
import ParallaxHero from '../components/effects/ParallaxHero'
import EventContactForm, { getFormFields } from '../components/forms/EventContactForm'
import { Watch, Utensils, Plane, Music, Sparkles, Shield, Phone, ChevronDown, CheckCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface FAQAccordionProps {
  id: string
  question: string
  answer: string
  isOpen: boolean
  onToggle: (id: string) => void
  faqRef: (el: HTMLDivElement | null) => void
}

function FAQAccordion({ id, question, answer, isOpen, onToggle, faqRef }: FAQAccordionProps) {
  return (
    <div 
      ref={faqRef}
      className="bg-dark-metal/50 border border-gray-600/30 rounded-lg overflow-hidden transition-all duration-500 hover:border-neon-blue/50"
    >
      <button
        onClick={() => onToggle(id)}
        className={`w-full px-8 py-6 text-left flex items-center justify-between transition-all duration-300 hover:bg-dark-metal/70 group ${
          isOpen ? 'bg-dark-metal/70' : ''
        }`}
      >
        <h3 className={`text-lg font-tech font-semibold transition-colors duration-300 ${
          isOpen ? 'text-neon-blue' : 'text-white group-hover:text-neon-blue'
        }`}>
          {question}
        </h3>
        <ChevronDown 
          className={`w-5 h-5 text-neon-blue transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-8 pb-6 pt-2">
          <div className="h-px bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent mb-4" />
          <p className="text-gray-300 leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VIPServices() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const faqRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Ensure page starts at top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const faqs = [
    {
      id: 'booking-process',
      question: 'How do I book VIP services with my rental?',
      answer: 'VIP services can be added during your supercar booking or arranged separately through our concierge team. Simply select the services you want, and our team will handle all reservations, timing, and logistics to ensure a seamless experience.'
    },
    {
      id: 'customization',
      question: 'Can I customize a VIP package?',
      answer: 'Absolutely! Every client is unique, and we specialize in creating bespoke experiences. Tell us your preferences, budget, and occasion, and our concierge team will craft a personalized package that exceeds your expectations.'
    },
    {
      id: 'group-services',
      question: 'Do you offer VIP services for large groups?',
      answer: 'Yes, we regularly arrange VIP experiences for groups of all sizes. From bachelor parties with fleet rentals and nightclub tables to corporate events with private dining and golf tournaments, we handle all the details for groups from 2 to 200+.'
    },
    {
      id: 'last-minute',
      question: 'Can you arrange last-minute VIP services?',
      answer: 'While advance booking ensures the best availability, our extensive Vegas connections often allow us to secure last-minute reservations at top venues. Our concierge team works 24/7 to accommodate urgent requests whenever possible.'
    },
    {
      id: 'payment-deposits',
      question: 'What are the payment terms for VIP services?',
      answer: 'Payment terms vary by service. Restaurant reservations typically require a deposit or credit card guarantee. Nightclub tables require full prepayment. Jewelry rentals require a security deposit. Our team will explain all costs upfront with no hidden fees.'
    },
    {
      id: 'concierge-availability',
      question: 'Is concierge support available during my experience?',
      answer: 'Yes! Your dedicated concierge is available 24/7 throughout your Vegas stay. Whether you need to modify reservations, handle unexpected requests, or resolve any issues, we\'re just a phone call away to ensure your experience is flawless.'
    }
  ]

  const toggleFAQ = (faqId: string) => {
    const newOpenFAQ = openFAQ === faqId ? null : faqId
    setOpenFAQ(newOpenFAQ)
    
    // Auto-scroll to the opened FAQ
    if (newOpenFAQ && faqRefs.current[newOpenFAQ]) {
      setTimeout(() => {
        faqRefs.current[newOpenFAQ]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 100)
    }
  }

  const services = [
    {
      icon: Watch,
      title: "Luxury Watch & Jewelry Rental",
      description: "Complete your look with Rolex, Patek Philippe, Cartier, and other prestigious timepieces.",
      features: [
        "Premium watch collection - price upon inquiry",
        "Diamond jewelry for special occasions",
        "Secure delivery to your hotel",
        "Insurance provided by partners where applicable; self-drive rentals require renter-provided full coverage insurance that transfers to a rental vehicle"
      ]
    },
    {
      icon: Utensils,
      title: "VIP Dining Experiences",
      description: "Skip the lines with exclusive access to Vegas's most sought-after restaurants.",
      features: [
        "Chef's table at Gordon Ramsay Hell's Kitchen",
        "Private dining rooms for groups",
        "Wine pairing experiences",
        "Impossible-to-get reservations secured"
      ]
    },
    {
      icon: Music,
      title: "Nightclub VIP Tables",
      description: "Party like a celebrity with premium table service at the hottest clubs.",
      features: [
        "Skip all lines with VIP host escort",
        "Prime table locations with city views",
        "Premium bottle service packages",
        "Access to exclusive artist tables"
      ]
    },
    {
      icon: Plane,
      title: "Private Aviation",
      description: "See Vegas from above with exclusive helicopter and jet experiences.",
      features: [
        "Private helicopter Strip tours",
        "Grand Canyon luxury excursions",
        "Doors-off photography flights",
        "Private jet day trips to LA"
      ]
    }
  ]

  const packages = [
    {
      name: "Vegas Mogul",
      price: "Price upon inquiry",
      duration: "Per Day",
      description: "The ultimate power player experience",
      includes: [
        "McLaren or Ferrari rental",
        "Luxury watch rental (Rolex/Patek)",
        "Chef's table dinner for 4",
        "VIP nightclub table with bottles",
        "Personal driver on standby"
      ]
    },
    {
      name: "High Roller Weekend",
      price: "Price upon inquiry",
      duration: "3 Days",
      description: "No expense spared luxury weekend",
      includes: [
        "Lamborghini Aventador for 3 days",
        "Shadow Creek golf with caddie",
        "Private Grand Canyon helicopter tour",
        "Lake Mead yacht day with captain",
        "VIP casino host services",
        "Couples spa day at Wynn"
      ]
    },
    {
      name: "Bachelor Party Elite",
      price: "Price upon inquiry",
      duration: "Per Person",
      description: "Legendary celebration package",
      includes: [
        "Fleet of 3-4 supercars",
        "Private dining room (up to 20)",
        "3 nightclub VIP tables",
        "Golf at TPC Las Vegas",
        "Party bus between venues",
        "Professional photographer"
      ]
    }
  ]

  const additionalServices = [
    "VIP casino host services",
    "Sports luxury boxes", 
    "Spa and wellness experiences",
    "Personal shopping at Crystals",
    "Show tickets with backstage access",
    "Private security services",
    "Lake Mead yacht charters",
    "Golf at exclusive courses"
  ]

  return (
    <main className="relative min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <ParallaxHero
        imageSrc="/images/hero/VIP Services Hero.avif"
        alt="Exclusive VIP services and luxury lifestyle"
      >
        <div className="relative z-20 flex h-full items-center justify-center px-4 pb-20">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-tech font-black mb-6">
              <span className="text-white">VIP</span><br />
              <span className="neon-text">CONCIERGE</span><br />
              <span className="text-white">SERVICES</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-8 sm:mb-12 font-light max-w-4xl mx-auto leading-relaxed">
              Beyond the wheel lies a world of exclusive experiences. Let our concierge team orchestrate 
              your perfect Vegas lifestyle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#services" className="btn-primary inline-block">
                EXPLORE SERVICES
              </a>
              <a href="#packages" className="btn-secondary inline-block">
                VIEW PACKAGES
              </a>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="w-6 h-10 border-2 border-neon-blue rounded-full flex justify-center">
            <div className="w-1 h-3 bg-neon-blue rounded-full mt-2 animate-bounce" />
          </div>
        </div>

        {/* Fade transition */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-[#0A0A0A] pointer-events-none" />
      </ParallaxHero>

      {/* Services Grid */}
      <section className="py-20 px-4 relative" id="services">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">CURATED</span>{' '}
              <span className="neon-text-magenta">EXPERIENCES</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Our concierge team has exclusive access to Vegas's most coveted experiences. 
              From impossible reservations to private events, we make it happen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 text-center group border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700 rounded-2xl">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal relative group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
                    <div className="absolute inset-0 rounded-full bg-neon-blue/10 blur-xl group-hover:bg-neon-blue/30" />
                    <service.icon className="w-10 h-10 text-neon-blue relative z-10" />
                  </div>
                  <h3 className="text-xl font-tech font-bold text-white mb-3">
                    {service.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    {service.description}
                  </p>
                </div>

                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-gray-400 text-xs">
                      <div className="w-1 h-1 bg-neon-pink rounded-full mt-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Additional Services */}
          <div className="mt-12 glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 rounded-2xl">
            <h3 className="text-2xl font-tech font-bold text-white mb-6 text-center">
              Additional VIP Services
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {additionalServices.map((service, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-300">
                  <Sparkles className="w-4 h-4 text-neon-pink flex-shrink-0" />
                  <span className="text-sm">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Signature Packages */}
      <section className="py-20 px-4 relative" id="packages">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">SIGNATURE</span>{' '}
              <span className="neon-text">PACKAGES</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Expertly crafted experiences that combine our supercars with Vegas's finest offerings. 
              Every detail handled, every moment unforgettable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-700 rounded-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-tech font-bold text-white mb-2">
                    {pkg.name}
                  </h3>
                  <div className="text-3xl font-tech font-black text-neon-blue mb-1">
                    {pkg.price}
                  </div>
                  <div className="text-sm text-gray-400 mb-3">{pkg.duration}</div>
                  <p className="text-gray-300 text-sm italic">"{pkg.description}"</p>
                </div>

                <div className="space-y-3 mb-8">
                  <h4 className="text-neon-pink font-tech font-semibold text-sm">INCLUDES:</h4>
                  {pkg.includes.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-neon-pink rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <a href="#contact" className="btn-secondary w-full inline-block">
                    INQUIRE NOW
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">WHITE GLOVE</span>{' '}
              <span className="neon-text-magenta">CONCIERGE</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              From initial consultation to your departure, our concierge team ensures every moment 
              is flawless.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gray-600/30 group-hover:border-neon-pink bg-dark-metal flex items-center justify-center relative group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all duration-700">
                <div className="absolute inset-0 rounded-full bg-neon-pink/10 blur-xl group-hover:bg-neon-pink/30" />
                <Phone className="w-10 h-10 text-neon-pink relative z-10" />
              </div>
              <h3 className="text-xl font-tech font-bold text-white mb-3">
                Personal Consultation
              </h3>
              <p className="text-gray-300 text-sm">
                Share your vision and preferences. Our team crafts a bespoke itinerary tailored 
                to your desires and budget.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gray-600/30 group-hover:border-neon-pink bg-dark-metal flex items-center justify-center relative group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all duration-700">
                <div className="absolute inset-0 rounded-full bg-neon-pink/10 blur-xl group-hover:bg-neon-pink/30" />
                <Shield className="w-10 h-10 text-neon-pink relative z-10" />
              </div>
              <h3 className="text-xl font-tech font-bold text-white mb-3">
                Seamless Execution
              </h3>
              <p className="text-gray-300 text-sm">
                Every reservation confirmed, every detail arranged. Your only job is to enjoy 
                the experience.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-gray-600/30 group-hover:border-neon-pink bg-dark-metal flex items-center justify-center relative group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all duration-700">
                <div className="absolute inset-0 rounded-full bg-neon-pink/10 blur-xl group-hover:bg-neon-pink/30" />
                <Sparkles className="w-10 h-10 text-neon-pink relative z-10" />
              </div>
              <h3 className="text-xl font-tech font-bold text-white mb-3">
                24/7 Support
              </h3>
              <p className="text-gray-300 text-sm">
                Your dedicated concierge remains available throughout your stay for any request, 
                any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">VIP SERVICES</span>{' '}
              <span className="neon-text">FAQ</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Everything you need to know about our concierge services and VIP experiences.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <FAQAccordion
                key={faq.id}
                id={faq.id}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === faq.id}
                onToggle={toggleFAQ}
                faqRef={(el) => { faqRefs.current[faq.id] = el }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <EventContactForm
        eventType="vip-services"
        title="PLAN YOUR VIP EXPERIENCE"
        subtitle="Let our concierge team create your perfect Vegas experience. Tell us about your preferences and we'll craft a personalized VIP package that exceeds your expectations."
        fields={getFormFields('vip-services')}
        submitButtonText="PLAN MY EXPERIENCE"
        successMessage="Welcome to the VIP experience! Our concierge team has received your request and will contact you within 24 hours with exclusive recommendations and personalized service options tailored to your preferences."
      />

      <Footer />
    </main>
  )
}