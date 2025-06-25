'use client'

import Navbar from '../components/navigation/Navbar'
import Footer from '../components/sections/Footer'
import { Gift, Camera, Star, Crown, Calendar, Users, ChevronDown } from 'lucide-react'
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

export default function BirthdayRentals() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const faqRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const faqs = [
    {
      id: 'best-package',
      question: "What's the best birthday package for my age?",
      answer: 'Our Milestone Moment package is perfect for 21st-40th birthdays focusing on social media and fun. Birthday Royalty suits 50+ celebrations with luxury dining and VIP treatment. Epic Birthday Bash works for any age group celebration with multiple people and full-day experiences.'
    },
    {
      id: 'social-media',
      question: 'Do you help with social media content creation?',
      answer: 'Absolutely! Every package includes professional photography optimized for Instagram, TikTok, and Facebook. We know the best photo spots, lighting, and angles to make your content go viral. All photos are edited and delivered within 24 hours via digital gallery.'
    },
    {
      id: 'surprise-rental',
      question: 'Can I surprise someone with a birthday rental?',
      answer: 'Yes! We specialize in surprise birthday experiences. We can coordinate with friends and family, handle all the planning discreetly, and even arrange for surprise elements like decorations, champagne, and custom birthday touches to make the moment extra special.'
    },
    {
      id: 'dinner-entertainment',
      question: 'What if I want to add dinner or entertainment?',
      answer: 'We have partnerships with the best restaurants and entertainment venues in Las Vegas. We can arrange VIP dining reservations, show tickets, club access, and coordinate timing so your supercar experience flows seamlessly with your other birthday plans.'
    },
    {
      id: 'booking-advance',
      question: 'How far in advance should I book for my birthday?',
      answer: 'We recommend booking 1-3 weeks in advance for the best vehicle selection and availability. However, we understand birthdays can be spontaneous, so we do our best to accommodate last-minute requests when possible. Weekend birthdays during peak season should be booked earlier.'
    },
    {
      id: 'what-makes-special',
      question: 'What makes DT Exotics birthday experiences special?',
      answer: 'We go beyond just car rentals. Every birthday package includes personalized touches like birthday decorations, champagne toasts, custom photography, and surprise elements. We treat every birthday like the milestone it is, creating memories that last far beyond the day itself.'
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
      title: "Milestone Moment",
      occasion: "21st, 30th, 40th Birthday",
      duration: "3 Hours",
      price: "$899",
      features: [
        "Single exotic supercar experience",
        "Professional birthday photoshoot",
        "Social media content package",
        "Birthday decorations included",
        "Complimentary champagne toast"
      ]
    },
    {
      title: "Birthday Royalty", 
      occasion: "50th, 60th+ Celebrations",
      duration: "5 Hours",
      price: "$1,499",
      features: [
        "Premium luxury vehicle selection",
        "VIP restaurant reservations",
        "Professional photography & video",
        "Custom birthday itinerary",
        "Personal concierge service",
        "Luxury gift presentation"
      ]
    },
    {
      title: "Epic Birthday Bash",
      occasion: "Group Celebrations",
      duration: "Full Day", 
      price: "$2,999",
      features: [
        "Multiple supercars for the crew",
        "Scenic drive to Red Rock Canyon",
        "Professional event coordination",
        "Group dining arrangements",
        "Social media documentation",
        "Surprise birthday elements"
      ]
    }
  ]

  const experiences = [
    {
      icon: Crown,
      title: "VIP Treatment",
      description: "Feel like royalty on your special day with red-carpet service and exclusive experiences."
    },
    {
      icon: Camera,
      title: "Memory Making",
      description: "Professional photography and videography to capture every unforgettable moment."
    },
    {
      icon: Star,
      title: "Social Media Magic",
      description: "Create content that'll have your followers speechless. Perfect for Instagram and TikTok."
    },
    {
      icon: Gift,
      title: "Surprise Elements",
      description: "We add special touches and surprises to make your birthday truly extraordinary."
    }
  ]

  const milestones = [
    {
      age: "21st",
      title: "Welcome to Adulthood",
      description: "Start your adult life in style with an exotic car experience that marks this major milestone.",
      image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      age: "30th",
      title: "Dirty Thirty Dreams",
      description: "Celebrate entering your prime with the luxury and sophistication you've earned.",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      age: "40th",
      title: "Fabulous at Forty",
      description: "You've made it! Celebrate your success with the ultimate luxury car experience.",
      image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
    },
    {
      age: "50th+",
      title: "Golden Years Glory",
      description: "You've earned the finest things in life. Experience automotive excellence at its peak.",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
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
            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
            alt="Birthday celebration with luxury car"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="relative z-20 flex h-full items-center justify-center px-4 pb-20">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-tech font-black mb-4 sm:mb-6 leading-tight">
              <span className="text-white">BIRTHDAY</span><br />
              <span className="neon-text">CELEBRATIONS</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-8 sm:mb-12 font-light max-w-4xl mx-auto leading-relaxed">
              Turn your special day into an unforgettable adventure. Celebrate another year of amazing with the luxury you deserve.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#packages" className="btn-primary inline-block">
                VIEW PACKAGES
              </a>
              <a href="#contact" className="btn-secondary inline-block">
                PLAN MY BIRTHDAY
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

      {/* Milestone Birthdays */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">MILESTONE</span>{' '}
              <span className="neon-text">BIRTHDAYS</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Every milestone deserves to be celebrated in style. Choose the experience 
              that matches your special age and achievements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 rounded-2xl overflow-hidden border border-gray-600/30 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-700">
                <div className="h-48 overflow-hidden">
                  <img
                    src={milestone.image}
                    alt={milestone.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-tech font-black text-neon-blue mb-2">
                      {milestone.age}
                    </div>
                    <h3 className="text-lg font-tech font-bold text-white mb-2">
                      {milestone.title}
                    </h3>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed text-center">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Features */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
              <span className="text-white">BIRTHDAY</span>{' '}
              <span className="neon-text-magenta">EXPERIENCES</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              We don't just rent cars—we create birthday memories that last a lifetime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
            {experiences.map((experience, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 text-center group border border-gray-600/30 group-hover:border-neon-pink group-hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all duration-700">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-gray-600/30 group-hover:border-neon-pink flex items-center justify-center bg-dark-metal relative group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all duration-700">
                  <div className="absolute inset-0 rounded-full bg-neon-pink/10 blur-xl group-hover:bg-neon-pink/30" />
                  <experience.icon className="w-10 h-10 text-neon-pink relative z-10" />
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
              <span className="text-white">BIRTHDAY</span>{' '}
              <span className="neon-text">PACKAGES</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              From intimate celebrations to grand gestures, we have the perfect package 
              to make your birthday unforgettable.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <div key={index} className="glass-panel bg-dark-metal/50 p-8 border border-gray-600/30 hover:border-neon-blue hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-700 rounded-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-tech font-bold text-white mb-2">
                    {pkg.title}
                  </h3>
                  <div className="text-neon-blue font-tech text-sm mb-1">{pkg.occasion}</div>
                  <div className="text-gray-400 text-sm mb-4">{pkg.duration}</div>
                  <div className="text-4xl font-tech font-black text-neon-blue">
                    {pkg.price}
                    <span className="text-lg text-gray-400 font-normal">/experience</span>
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

      {/* Social Media Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-[1000px] mx-auto">
          <div className="glass-panel bg-dark-metal/50 p-12 border border-gray-600/30 rounded-2xl">
            <div className="text-center">
              <Camera className="w-16 h-16 text-neon-pink mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-tech font-black text-white mb-6">
                <span className="text-white">CONTENT CREATION</span>{' '}
                <span className="neon-text-magenta">INCLUDED</span>
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed mb-8">
                Your birthday deserves to go viral! Every package includes professional photography 
                and videography designed specifically for social media. Get Instagram-worthy shots, 
                TikTok-ready videos, and content that'll have your followers hitting that like button all year long.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <Calendar className="w-8 h-8 text-neon-pink mx-auto mb-2" />
                  <h3 className="font-tech font-bold text-white mb-1">Professional Photos</h3>
                  <p className="text-gray-400 text-sm">High-res images for all platforms</p>
                </div>
                <div>
                  <Star className="w-8 h-8 text-neon-pink mx-auto mb-2" />
                  <h3 className="font-tech font-bold text-white mb-1">Video Content</h3>
                  <p className="text-gray-400 text-sm">TikTok & Instagram Reels ready</p>
                </div>
                <div>
                  <Users className="w-8 h-8 text-neon-pink mx-auto mb-2" />
                  <h3 className="font-tech font-bold text-white mb-1">Same-Day Delivery</h3>
                  <p className="text-gray-400 text-sm">Content delivered within 24 hours</p>
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
              <span className="text-white">BIRTHDAY</span>{' '}
              <span className="neon-text-magenta">FAQ</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Common questions about making your birthday celebration unforgettable in Las Vegas.
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
            <span className="text-white">READY TO CELEBRATE</span><br />
            <span className="neon-text-magenta">IN STYLE?</span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Your birthday only comes once a year—make it count. Contact us to create 
            a celebration that's as unique and amazing as you are.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="sms:+17027208948" 
              className="btn-primary inline-block"
            >
              TEXT US NOW
            </a>
            <a href="#contact" className="btn-secondary inline-block">
              PLAN MY BIRTHDAY
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}