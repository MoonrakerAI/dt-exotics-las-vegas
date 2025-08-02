'use client'

import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'
import ParallaxHero from '../components/effects/ParallaxHero'
import EventContactForm, { getFormFields } from '../components/forms/EventContactForm'
import { Car, Users, MapPin, Clock, Star, Shield, ChevronDown } from 'lucide-react'
import { useState, useRef } from 'react'

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

export default function BachelorPartyRentals() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const faqRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const faqs = [
    {
      id: 'booking-advance',
      question: 'How far in advance should we book?',
      answer: 'We recommend booking at least 2-4 weeks in advance, especially for weekend bachelor parties. Popular dates like March Madness, EDC, and major fight weekends book up quickly. However, we can often accommodate last-minute requests depending on availability.'
    },
    {
      id: 'package-inclusions',
      question: "What's included in our packages?",
      answer: 'All packages include professional photography, fuel, insurance, and 24/7 support. Higher-tier packages add VIP experiences like restaurant reservations, club access, professional videography, and custom itinerary planning. We handle all the details so you can focus on celebrating.'
    },
    {
      id: 'customization',
      question: 'Can we customize our bachelor party experience?',
      answer: 'Absolutely! Every bachelor party is unique, and we specialize in creating custom experiences. Want to add a helicopter tour? Private poker night? Exclusive venue access? We have connections throughout Las Vegas to make any vision a reality.'
    },
    {
      id: 'requirements',
      question: 'What are the age and license requirements?',
      answer: "The primary driver must be 21+ with a valid driver's license and full insurance coverage. Additional drivers can be added for an extra fee. We require a security deposit (refundable) and all drivers must pass our brief safety orientation."
    },
    {
      id: 'transportation',
      question: 'Do you provide transportation between venues?',
      answer: 'Yes! Our Legendary and Epic packages include coordinated transportation between nightclubs, restaurants, and attractions. We work with the best venues on the Strip to ensure VIP treatment and no wait times for your group.'
    },
    {
      id: 'weather-emergency',
      question: "What happens if there's bad weather or an emergency?",
      answer: "Las Vegas enjoys over 300 sunny days per year, but we're prepared for any situation. We offer flexible rescheduling for weather emergencies and have 24/7 support for any issues. Our comprehensive insurance covers unexpected situations, giving you peace of mind."
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
  const packages = [
    {
      title: "The Squad Package",
      cars: "2-3 Supercars",
      duration: "4 Hours",
      price: "Price upon inquiry",
      features: [
        "Multiple exotic vehicles for the group",
        "Professional photography session",
        "Strip cruise coordination",
        "VIP club arrival assistance",
        "Fuel and insurance included"
      ]
    },
    {
      title: "The Legend Package", 
      cars: "4-5 Supercars",
      duration: "6 Hours",
      price: "Price upon inquiry",
      features: [
        "Full fleet for larger groups",
        "Dedicated concierge service",
        "Red Rock Canyon scenic route",
        "Professional videography",
        "Champagne toast included",
        "Restaurant reservations"
      ]
    },
    {
      title: "The Epic Package",
      cars: "6+ Supercars",
      duration: "8 Hours", 
      price: "Price upon inquiry",
      features: [
        "Ultimate supercar convoy experience",
        "Personal event coordinator",
        "Custom itinerary planning",
        "Professional photo/video crew",
        "VIP nightclub arrangements",
        "Luxury transportation coordination"
      ]
    }
  ]

  const experiences = [
    {
      icon: MapPin,
      title: "Strip Domination",
      description: "Cruise the iconic Las Vegas Strip in a convoy of supercars. Turn heads and create unforgettable memories."
    },
    {
      icon: Car,
      title: "Track Experience",
      description: "Optional track day at local racing facilities for the ultimate adrenaline rush with professional instruction."
    },
    {
      icon: Star,
      title: "VIP Treatment",
      description: "Arrive at clubs and venues in style. Our concierge ensures VIP access and premium treatment."
    },
    {
      icon: Users,
      title: "Group Coordination",
      description: "Seamless coordination for groups of 4-20+ people. Multiple vehicles to keep the party together."
    }
  ]

  return (
    <main className="relative min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <ParallaxHero
        imageSrc="/images/hero/Bachelor Parties Hero.avif"
        alt="Bachelor party celebration in Las Vegas"
      >
        <div className="relative z-20 flex h-full items-center justify-center px-4 pb-20">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-tech font-black mb-6">
              <span className="text-white">BACHELOR PARTY</span><br />
              <span className="neon-text">SUPERCARS</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-8 sm:mb-12 font-light max-w-4xl mx-auto leading-relaxed">
              Make his last night of freedom legendary. Dominate Vegas with a fleet of exotic supercars that'll have everyone talking for years.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#packages" className="btn-primary inline-block">
                VIEW PACKAGES
              </a>
              <a href="#contact" className="btn-secondary inline-block">
                CUSTOM QUOTE
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

      {/* Why Choose Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">WHY CHOOSE</span>{' '}
              <span className="neon-text">DT EXOTICS?</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              We specialize in bachelor party experiences that go beyond ordinary. 
              Here's what sets us apart from the competition.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
            {experiences.map((experience, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 text-center group border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal relative group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
                  <div className="absolute inset-0 rounded-full bg-neon-blue/10 blur-xl group-hover:bg-neon-blue/30" />
                  <experience.icon className="w-10 h-10 text-neon-blue relative z-10" />
                </div>
                
                <h3 className="text-lg font-tech font-bold mb-4 text-white">
                  {experience.title}
                </h3>
                
                <p className="text-gray-300 text-sm leading-relaxed">
                  {experience.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 px-4 relative" id="packages">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">PARTY</span>{' '}
              <span className="neon-text-magenta">PACKAGES</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Choose from our curated packages or let us create a custom experience 
              tailored to your group's vision of the perfect bachelor party.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-700 rounded-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-tech font-bold text-white mb-2">
                    {pkg.title}
                  </h3>
                  <div className="text-neon-blue font-tech text-lg mb-1">{pkg.cars}</div>
                  <div className="text-gray-400 text-sm mb-4">{pkg.duration}</div>
                  <div className="text-4xl font-tech font-black text-neon-blue">
                    {pkg.price}
                    <span className="text-lg text-gray-400 font-normal">/group</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-neon-pink rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <a href="#contact" className="btn-secondary w-full inline-block">
                    BOOK NOW
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">EPIC</span>{' '}
              <span className="neon-text">MOMENTS</span>
            </h2>
            <p className="text-lg text-gray-400">
              See what unforgettable experiences look like
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Group of guys celebrating bachelor party with drinks and high energy"
                className="w-full h-64 object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Bachelor party group at concert or club with live music and party atmosphere"
                className="w-full h-64 object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Male friends bonding and celebrating together at exclusive party venue"
                className="w-full h-64 object-cover rounded-lg group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Assurance */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="glass-panel bg-dark-metal/50 p-12 border border-gray-600/30 rounded-2xl">
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 text-neon-blue mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-tech font-black text-white mb-4">
                SAFETY & PEACE OF MIND
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                We understand the responsibility that comes with bachelor parties. All our packages include 
                comprehensive insurance, 24/7 support, and optional professional chauffeur services to ensure 
                everyone gets home safely. Because the best parties are the ones everyone remembers for the right reasons.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Clock className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                <h3 className="font-tech font-bold text-white mb-1">24/7 Support</h3>
                <p className="text-gray-400 text-sm">Around-the-clock assistance</p>
              </div>
              <div>
                <Shield className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                <h3 className="font-tech font-bold text-white mb-1">Full Insurance</h3>
                <p className="text-gray-400 text-sm">Comprehensive coverage included</p>
              </div>
              <div>
                <Users className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                <h3 className="font-tech font-bold text-white mb-1">Professional Staff</h3>
                <p className="text-gray-400 text-sm">Experienced event coordination</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">BACHELOR PARTY</span>{' '}
              <span className="neon-text">FAQ</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Everything you need to know about planning the ultimate Vegas bachelor party experience.
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
        eventType="bachelor-party"
        title="PLAN YOUR LEGENDARY BACHELOR PARTY"
        subtitle="Tell us about your vision and we'll create the ultimate Vegas bachelor party experience. Every detail customized, every moment unforgettable."
        fields={getFormFields('bachelor-party')}
        submitButtonText="GET MY CUSTOM QUOTE"
        successMessage="We've received your bachelor party inquiry! Our team will contact you within 24 hours with a custom quote and exclusive recommendations to make this celebration legendary."
      />

      <Footer />
    </main>
  )
}