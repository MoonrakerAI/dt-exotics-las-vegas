'use client'

import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'
import ParallaxHero from '../components/effects/ParallaxHero'
import { Briefcase, Handshake, Trophy, Users, Shield, Clock, ChevronDown } from 'lucide-react'
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

export default function CorporateServices() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const faqRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const faqs = [
    {
      id: 'corporate-billing',
      question: 'How does corporate billing work?',
      answer: 'We offer streamlined corporate billing with net-30 payment terms for qualified businesses. You\'ll receive detailed invoices with expense categorization, and we can integrate with your preferred accounting systems. Setup typically takes 1-2 business days with credit approval.'
    },
    {
      id: 'last-minute-requests',
      question: 'Can you handle last-minute executive transportation requests?',
      answer: 'Absolutely. We maintain a priority fleet specifically for corporate clients and offer 24/7 concierge services. For urgent requests, we can typically accommodate same-day bookings within 2-4 hours, depending on vehicle availability and routing requirements.'
    },
    {
      id: 'insurance-coverage',
      question: 'What insurance coverage is included for corporate events?',
      answer: 'All vehicles include comprehensive commercial insurance with $2M liability coverage, full collision and comprehensive protection, and additional corporate umbrella coverage. We can provide certificates of insurance for your events and add your company as an additional insured when required.'
    },
    {
      id: 'chauffeur-services',
      question: 'Do you provide chauffeur services for client entertainment?',
      answer: 'Yes, we offer professional chauffeur services with background-checked, licensed drivers who understand corporate protocol. They\'re trained in discretion, punctuality, and providing exceptional service that reflects positively on your company\'s image.'
    },
    {
      id: 'group-coordination',
      question: 'Can you coordinate transportation for large corporate groups?',
      answer: 'We specialize in coordinating multi-vehicle logistics for corporate events, conferences, and group entertainment. Our team can manage complex itineraries, synchronized departures/arrivals, and real-time coordination to ensure seamless experiences for groups of any size.'
    },
    {
      id: 'what-makes-different',
      question: 'What makes DT Exotics different from other corporate transportation services?',
      answer: 'We focus exclusively on luxury and exotic vehicles that make a statement. While others offer standard sedan services, we provide experiences that elevate your brand image, impress clients, and create memorable moments that strengthen business relationships. It\'s transportation as a strategic business tool.'
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
      title: "Executive Transportation",
      price: "Price upon inquiry",
      features: [
        "Premium luxury vehicle selection",
        "Professional chauffeur service",
        "Airport pickup and drop-off",
        "Flexible scheduling",
        "Corporate billing available"
      ]
    },
    {
      title: "Client Entertainment", 
      price: "Price upon inquiry",
      features: [
        "Impressive client experiences",
        "Multiple vehicle fleet options",
        "Custom itinerary planning",
        "Professional event coordination",
        "VIP restaurant reservations"
      ]
    },
    {
      title: "Corporate Events",
      price: "Price upon inquiry",
      features: [
        "Product launch experiences",
        "Team building adventures",
        "Conference transportation",
        "Incentive reward programs",
        "Full-service event management"
      ]
    }
  ]

  const benefits = [
    {
      icon: Briefcase,
      title: "Professional Image",
      description: "Elevate your company's image with luxury transportation that reflects your success and attention to detail."
    },
    {
      icon: Handshake,
      title: "Client Impressions",
      description: "Make unforgettable first impressions that set the tone for successful business relationships."
    },
    {
      icon: Trophy,
      title: "Employee Recognition",
      description: "Reward your top performers with exclusive experiences that motivate and inspire your entire team."
    },
    {
      icon: Users,
      title: "Team Building",
      description: "Create shared memories and strengthen team bonds with unique automotive experiences."
    }
  ]

  const industries = [
    {
      title: "Technology",
      description: "Impress clients and partners with cutting-edge luxury that matches your innovative spirit.",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      title: "Real Estate",
      description: "Transport high-value clients in vehicles that reflect the luxury properties you represent.",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      title: "Entertainment",
      description: "Provide A-list treatment for celebrities, executives, and VIP guests at your events.",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      title: "Finance",
      description: "Demonstrate success and reliability with premium transportation for executives and clients.",
      image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    }
  ]

  return (
    <main className="relative min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <ParallaxHero
        imageSrc="/images/hero/Corporate Hero.avif"
        alt="Corporate luxury experience in Las Vegas"
      >
        <div className="relative z-20 flex h-full items-center justify-center px-4 pb-20">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-tech font-black mb-6">
              <span className="text-white">CORPORATE</span><br />
              <span className="neon-text">EXCELLENCE</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-8 sm:mb-12 font-light max-w-4xl mx-auto leading-relaxed">
              Elevate your business image with luxury transportation solutions that make every interaction memorable and every impression lasting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#services" className="btn-primary inline-block">
                VIEW SERVICES
              </a>
              <a href="#contact" className="btn-secondary inline-block">
                REQUEST QUOTE
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

      {/* Business Benefits */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">BUSINESS</span>{' '}
              <span className="neon-text">ADVANTAGES</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              In business, perception is reality. Our luxury transportation services help you 
              make the right impression every time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 text-center group border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal relative group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
                  <div className="absolute inset-0 rounded-full bg-neon-blue/10 blur-xl group-hover:bg-neon-blue/30" />
                  <benefit.icon className="w-10 h-10 text-neon-blue relative z-10" />
                </div>
                
                <h3 className="text-lg font-tech font-bold mb-4 text-white">
                  {benefit.title}
                </h3>
                
                <p className="text-gray-300 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 relative" id="services">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">CORPORATE</span>{' '}
              <span className="neon-text-magenta">SERVICES</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Tailored transportation solutions designed to meet the unique needs 
              of modern businesses and their executives.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-700 rounded-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-tech font-bold text-white mb-4">
                    {service.title}
                  </h3>
                  <div className="text-3xl font-tech font-black text-neon-blue mb-6">
                    {service.price}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-neon-pink rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <a href="#contact" className="btn-secondary w-full inline-block">
                    GET QUOTE
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">INDUSTRIES</span>{' '}
              <span className="neon-text">WE SERVE</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              We understand the unique requirements of different industries and tailor 
              our services to exceed your specific expectations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {industries.map((industry, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 rounded-2xl overflow-hidden border border-gray-600/30 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-700">
                <div className="h-48 overflow-hidden">
                  <img
                    src={industry.image}
                    alt={industry.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-tech font-bold text-white mb-3">
                    {industry.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {industry.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Assurance */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="glass-panel bg-dark-metal/50 p-12 border border-gray-600/30 rounded-2xl">
            <div className="text-center mb-8">
              <Shield className="w-16 h-16 text-neon-blue mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-tech font-black text-white mb-4">
                PROFESSIONAL RELIABILITY
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                We understand that business cannot afford delays or disappointments. Our corporate services 
                include comprehensive insurance, professional drivers, 24/7 support, and guaranteed on-time service. 
                Your reputation is safe with us.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Clock className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                <h3 className="font-tech font-bold text-white mb-1">On-Time Guarantee</h3>
                <p className="text-gray-400 text-sm">Punctuality you can depend on</p>
              </div>
              <div>
                <Shield className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                <h3 className="font-tech font-bold text-white mb-1">Full Insurance</h3>
                <p className="text-gray-400 text-sm">Comprehensive coverage included</p>
              </div>
              <div>
                <Briefcase className="w-8 h-8 text-neon-blue mx-auto mb-2" />
                <h3 className="font-tech font-bold text-white mb-1">Corporate Billing</h3>
                <p className="text-gray-400 text-sm">Simplified expense management</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="glass-panel bg-dark-metal/50 p-12 border border-gray-600/30 rounded-2xl">
            <div className="mb-8">
              <div className="text-6xl text-neon-blue mb-4">"</div>
              <p className="text-xl md:text-2xl text-white font-light leading-relaxed mb-6">
                DT EXOTICS LV transformed our client entertainment strategy. The luxury vehicles 
                and professional service helped us close our biggest deal of the year.
              </p>
              <div className="text-neon-blue font-tech font-bold">
                - Fortune 500 Executive
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
              <span className="text-white">CORPORATE</span>{' '}
              <span className="neon-text">FAQ</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Common questions about our corporate luxury transportation services in Las Vegas.
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

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-tech font-black mb-8">
            <span className="text-white">READY TO ELEVATE</span><br />
            <span className="neon-text-magenta">YOUR BUSINESS?</span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Partner with Las Vegas's premier luxury transportation service. Contact us to discuss 
            how we can enhance your corporate image and business relationships.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="sms:+17025180924" 
              className="btn-primary inline-block"
            >
              CONTACT US
            </a>
            <a href="#contact" className="btn-secondary inline-block">
              REQUEST PROPOSAL
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}