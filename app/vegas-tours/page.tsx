'use client'

import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'
import { MapPin, Camera, Route, Sunset, Mountain, Building, ChevronDown } from 'lucide-react'
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

export default function VegasTours() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const faqRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const faqs = [
    {
      id: 'photography-included',
      question: "What's included in the tour photography?",
      answer: 'Every tour includes professional photography at the most scenic stops, with edited high-resolution images delivered within 24 hours. We know the best angles, lighting, and iconic Vegas backdrops to create stunning photos perfect for social media or personal memories.'
    },
    {
      id: 'customize-route',
      question: 'Can we customize our tour route?',
      answer: 'Absolutely! While our signature tours cover the most popular destinations, we specialize in custom itineraries. Want to include specific photo locations, restaurant stops, or scenic detours? We\'ll create a personalized route that matches your interests and schedule.'
    },
    {
      id: 'first-time-visitors',
      question: 'Is this suitable for first-time Vegas visitors?',
      answer: 'Perfect for first-timers! Our tours are designed to showcase both the famous Strip attractions and hidden gems that most tourists never see. Your guide provides insider knowledge about Vegas history, culture, and the best spots for dining and entertainment.'
    },
    {
      id: 'weather-affects',
      question: 'What happens if weather affects our tour?',
      answer: 'Las Vegas has over 300 sunny days per year, but we\'re prepared for any conditions. We offer flexible rescheduling for severe weather and have alternative indoor activities and covered photo locations. Light rain actually creates unique photo opportunities with dramatic lighting!'
    },
    {
      id: 'add-dining-entertainment',
      question: 'Can we add dining or entertainment to our tour?',
      answer: 'Yes! We have partnerships with top restaurants and entertainment venues throughout Las Vegas. We can arrange VIP dining reservations, show tickets, and exclusive access to create a complete Vegas experience that flows seamlessly with your supercar tour.'
    },
    {
      id: 'compare-experiences',
      question: 'How do your tours compare to other Vegas experiences?',
      answer: 'Our tours combine the thrill of driving exotic supercars with the beauty of Nevada\'s landscapes and the excitement of Las Vegas. Unlike bus tours or walking tours, you\'re actively participating in the adventure while creating once-in-a-lifetime memories and content that\'ll impress for years to come.'
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
  const tours = [
    {
      title: "Strip Spectacular",
      duration: "2 Hours",
      distance: "15 Miles",
      price: "$499",
      features: [
        "Iconic Las Vegas Strip cruise",
        "Photo stops at famous landmarks",
        "Professional photography included",
        "Welcome champagne service",
        "Social media content package"
      ]
    },
    {
      title: "Red Rock Adventure", 
      duration: "4 Hours",
      distance: "60 Miles",
      price: "$899",
      features: [
        "Scenic Red Rock Canyon drive",
        "Stunning desert landscapes",
        "Multiple photo opportunities",
        "Luxury picnic experience",
        "Professional tour guidance",
        "Fuel and refreshments included"
      ]
    },
    {
      title: "Vegas VIP Experience",
      duration: "6 Hours",
      distance: "100 Miles", 
      price: "$1,499",
      features: [
        "Complete Las Vegas tour package",
        "Strip, Red Rock, and Valley of Fire",
        "VIP restaurant reservations",
        "Professional photography & videography",
        "Custom itinerary planning",
        "Luxury amenities throughout"
      ]
    }
  ]

  const destinations = [
    {
      icon: Building,
      title: "Las Vegas Strip",
      description: "Cruise the most famous street in the world in style. From the Bellagio fountains to the Venetian canals.",
      highlights: ["Bellagio Fountains", "Caesar's Palace", "Venetian Canals", "High Roller Observation Wheel"]
    },
    {
      icon: Mountain,
      title: "Red Rock Canyon",
      description: "Experience breathtaking desert landscapes just 20 minutes from the Strip. Perfect for dramatic photos.",
      highlights: ["13-Mile Scenic Drive", "Desert Wildlife", "Ancient Rock Formations", "Valley Views"]
    },
    {
      icon: Sunset,
      title: "Valley of Fire",
      description: "Nevada's oldest state park offers otherworldly red sandstone formations and incredible sunset views.",
      highlights: ["Fire Wave Trail", "Elephant Rock", "Ancient Petroglyphs", "Sunset Photography"]
    },
    {
      icon: Route,
      title: "Lake Las Vegas",
      description: "Luxury lakeside community with Mediterranean-inspired architecture and serene water views.",
      highlights: ["Lakeside Drives", "Luxury Resorts", "Mediterranean Village", "Scenic Overlooks"]
    }
  ]

  const experiences = [
    {
      title: "First-Time Visitors",
      description: "New to Vegas? Let us show you the city like a local with insider knowledge and exclusive access.",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      title: "Anniversary Celebrations",
      description: "Romantic drives through stunning landscapes, perfect for celebrating love and special milestones.",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      title: "Content Creation",
      description: "Influencers and content creators love our tours for the incredible backdrops and unique perspectives.",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    }
  ]

  return (
    <main className="relative min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-dark-gray/60 z-10" />
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Las Vegas Strip with supercar"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-20 flex h-full items-center justify-center px-4 pb-20">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-tech font-black mb-6">
              <span className="text-white">VEGAS</span><br />
              <span className="neon-text">ADVENTURES</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-8 sm:mb-12 font-light max-w-4xl mx-auto leading-relaxed">
              Discover Las Vegas like never before. From the neon-lit Strip to breathtaking desert landscapes, experience it all behind the wheel of a supercar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#tours" className="btn-primary inline-block">
                EXPLORE TOURS
              </a>
              <a href="#contact" className="btn-secondary inline-block">
                CUSTOM TOUR
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
      </section>

      {/* Destinations Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">ICONIC</span>{' '}
              <span className="neon-text">DESTINATIONS</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              From world-famous landmarks to hidden gems, explore the diverse beauty 
              that surrounds Las Vegas in ultimate luxury.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
            {destinations.map((destination, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 hover:border-neon-blue hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-700 rounded-2xl">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-gray-600/30 hover:border-neon-blue flex items-center justify-center bg-dark-metal transition-all duration-700">
                    <destination.icon className="w-8 h-8 text-neon-blue" />
                  </div>
                  <h3 className="text-xl font-tech font-bold text-white mb-3">
                    {destination.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    {destination.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-tech font-bold text-neon-blue mb-2 uppercase">Highlights</h4>
                  <ul className="space-y-1">
                    {destination.highlights.map((highlight, highlightIndex) => (
                      <li key={highlightIndex} className="flex items-start gap-2 text-gray-400 text-xs">
                        <div className="w-1 h-1 bg-neon-pink rounded-full mt-2 flex-shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tour Packages */}
      <section className="py-20 px-4 relative" id="tours">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">TOUR</span>{' '}
              <span className="neon-text-magenta">PACKAGES</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Choose from our signature tours or create a custom experience 
              tailored to your interests and schedule.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {tours.map((tour, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-700 rounded-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-tech font-bold text-white mb-2">
                    {tour.title}
                  </h3>
                  <div className="flex justify-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {tour.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Route className="w-4 h-4" />
                      {tour.duration}
                    </span>
                  </div>
                  <div className="text-4xl font-tech font-black text-neon-blue">
                    {tour.price}
                    <span className="text-lg text-gray-400 font-normal">/tour</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tour.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-neon-pink rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  <a href="#contact" className="btn-secondary w-full inline-block">
                    BOOK TOUR
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Types */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">PERFECT FOR</span>{' '}
              <span className="neon-text">EVERY OCCASION</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Whether you're visiting for the first time or celebrating a special moment, 
              we have the perfect tour experience for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {experiences.map((experience, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 rounded-2xl overflow-hidden border border-gray-600/30 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-700">
                <div className="h-64 overflow-hidden">
                  <img
                    src={experience.image}
                    alt={experience.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-tech font-bold text-white mb-4">
                    {experience.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {experience.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photography Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="glass-panel bg-dark-metal/50 p-12 border border-gray-600/30 rounded-2xl">
            <div className="text-center">
              <Camera className="w-16 h-16 text-neon-pink mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-tech font-black text-white mb-6">
                <span className="text-white">CAPTURE EVERY</span>{' '}
                <span className="neon-text-magenta">MOMENT</span>
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                Every tour includes professional photography to capture your adventure. From Instagram-worthy 
                shots on the Strip to breathtaking landscape photos in Red Rock Canyon, we ensure you have 
                stunning memories to share. All photos are delivered within 24 hours via digital gallery.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <Camera className="w-8 h-8 text-neon-pink mx-auto mb-2" />
                  <h3 className="font-tech font-bold text-white mb-1">Professional Photos</h3>
                  <p className="text-gray-400 text-sm">High-resolution images included</p>
                </div>
                <div>
                  <MapPin className="w-8 h-8 text-neon-pink mx-auto mb-2" />
                  <h3 className="font-tech font-bold text-white mb-1">Multiple Locations</h3>
                  <p className="text-gray-400 text-sm">Best spots for stunning shots</p>
                </div>
                <div>
                  <Sunset className="w-8 h-8 text-neon-pink mx-auto mb-2" />
                  <h3 className="font-tech font-bold text-white mb-1">Golden Hour</h3>
                  <p className="text-gray-400 text-sm">Perfect lighting every time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planning Your Visit */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-tech font-black text-white mb-6">
              PLANNING YOUR VEGAS ADVENTURE
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 rounded-2xl">
              <h3 className="text-xl font-tech font-bold text-white mb-4">Best Times to Visit</h3>
              <div className="space-y-3 text-gray-300 text-sm">
                <div>
                  <span className="text-neon-blue font-tech font-bold">Morning Tours:</span> Perfect for avoiding crowds and heat
                </div>
                <div>
                  <span className="text-neon-blue font-tech font-bold">Sunset Tours:</span> Ideal for photography and romantic drives
                </div>
                <div>
                  <span className="text-neon-blue font-tech font-bold">Weekend Specials:</span> Enhanced experiences with extended routes
                </div>
              </div>
            </div>

            <div className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 rounded-2xl">
              <h3 className="text-xl font-tech font-bold text-white mb-4">What's Included</h3>
              <div className="space-y-3 text-gray-300 text-sm">
                <div>
                  <span className="text-neon-blue font-tech font-bold">Professional Guide:</span> Local expert with insider knowledge
                </div>
                <div>
                  <span className="text-neon-blue font-tech font-bold">Photography:</span> Professional photos at scenic stops
                </div>
                <div>
                  <span className="text-neon-blue font-tech font-bold">Refreshments:</span> Water, snacks, and welcome champagne
                </div>
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
              <span className="text-white">VEGAS TOURS</span>{' '}
              <span className="neon-text">FAQ</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Everything you need to know about exploring Las Vegas in luxury supercars.
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
            <span className="text-white">READY FOR YOUR</span><br />
            <span className="neon-text-magenta">VEGAS ADVENTURE?</span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Book your luxury tour today and discover why our Vegas experiences are rated as 
            the best way to see the city. Adventure awaits!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="sms:+17027208948" 
              className="btn-primary inline-block"
            >
              BOOK NOW
            </a>
            <a href="#contact" className="btn-secondary inline-block">
              CUSTOM TOUR
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}