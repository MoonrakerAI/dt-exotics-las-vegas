'use client'

import { useState, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
}

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null)
  const faqRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const faqs: FAQ[] = [
    {
      id: 'how-to-rent',
      question: 'How do I rent a car from DT EXOTICS LV?',
      answer: 'Renting a car is simple! Contact us to check availability, provide a valid driver\'s license, proof of insurance, and make a reservation. We\'ll guide you through the quick and easy process.'
    },
    {
      id: 'age-requirements',
      question: 'What are the age requirements to rent a car?',
      answer: 'Renters must show driver\'s license and be at least 21 years old for most vehicles and 25 years old for high-performance models. Additional requirements may apply.'
    },
    {
      id: 'security-deposit',
      question: 'Do I need a security deposit?',
      answer: 'Yes, a refundable security deposit is required. The amount depends on the car and will be returned after the vehicle is returned in the same condition.'
    },
    {
      id: 'insurance-required',
      question: 'Is insurance required to rent a car?',
      answer: 'Yes, all renters must provide proof of full coverage insurance that transfers to a rental vehicle. If you don\'t have coverage, we can assist with rental insurance options.'
    },
    {
      id: 'mileage-limits',
      question: 'Are there mileage limits?',
      answer: 'Each rental includes a set mileage limit. Additional miles can be purchased if you plan to drive further. Contact us for specific details.'
    },
    {
      id: 'outside-vegas',
      question: 'Can I take the car outside of Las Vegas?',
      answer: 'Due to liabilities you may not take any of the cars out of Las Vegas.'
    },
    {
      id: 'delivery-pickup',
      question: 'Do you offer delivery and pickup?',
      answer: 'Yes! We provide convenient delivery and pickup services to hotels, airports, and other locations for an additional fee.'
    },
    {
      id: 'tickets-tolls',
      question: 'What happens if I get a ticket or toll charge?',
      answer: 'There are NO tolls in Las Vegas.'
    },
    {
      id: 'cancellation-policy',
      question: 'What is your cancellation policy?',
      answer: 'Cancellations made within a certain timeframe may be eligible for a refund or credit. Contact us for details on our cancellation terms.'
    },
    {
      id: 'how-to-book',
      question: 'How can I book my rental?',
      answer: 'You can book your exotic car rental by calling us, sending a message, or filling out our online reservation form. Get ready for an unforgettable driving experience in Las Vegas!'
    },
    {
      id: 'fuel-policy',
      question: 'What is your fuel policy?',
      answer: 'All vehicles are delivered with a full tank and must be returned with a full tank. If not returned full, a refueling charge will apply at premium rates.'
    },
    {
      id: 'driver-requirements',
      question: 'What are the driver requirements?',
      answer: 'All drivers must have a clean driving record, valid driver\'s license, and meet our insurance requirements. Additional drivers can be added for an extra fee.'
    },
    {
      id: 'damage-policy',
      question: 'What happens if there\'s damage to the vehicle?',
      answer: 'Any damage beyond normal wear and tear will be assessed and charged to the renter. We recommend documenting the vehicle condition during pickup and return.'
    },
    {
      id: 'rental-duration',
      question: 'What are your minimum and maximum rental periods?',
      answer: 'We offer flexible rental periods from 4-hour minimum rentals to extended weekly packages. Contact us for custom arrangements for longer periods.'
    },
    {
      id: 'payment-methods',
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards including Visa, MasterCard, and American Express. Payment is required at the time of booking along with the security deposit.'
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

  return (
    <section className="py-20 px-4 relative" id="faq">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
            <span className="text-white">FAQ</span><span className="neon-text">s</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Have questions about renting a luxury or exotic car in Las Vegas? We've got you covered! From age requirements and insurance to mileage limits and delivery options, our FAQ section provides all the essential details to ensure a smooth and hassle-free rental experience. Whether you're cruising the Strip or heading out on an adventure, get the answers you need before hitting the road in style!
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div 
              key={faq.id}
              ref={(el) => { faqRefs.current[faq.id] = el }}
              className="bg-dark-metal/50 border border-gray-600/30 rounded-lg overflow-hidden transition-all duration-500 hover:border-neon-blue/50"
            >
              <button
                onClick={() => toggleFAQ(faq.id)}
                className={`w-full px-8 py-6 text-left flex items-center justify-between transition-all duration-300 hover:bg-dark-metal/70 group ${
                  openFAQ === faq.id ? 'bg-dark-metal/70' : ''
                }`}
              >
                <h3 className={`text-lg font-tech font-semibold transition-colors duration-300 ${
                  openFAQ === faq.id ? 'text-neon-blue' : 'text-white group-hover:text-neon-blue'
                }`}>
                  {faq.question}
                </h3>
                <ChevronDown 
                  className={`w-5 h-5 text-neon-blue transition-transform duration-300 ${
                    openFAQ === faq.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openFAQ === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 pb-6 pt-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-neon-blue/30 to-transparent mb-4" />
                  <p className="text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-gray-300 mb-6">
            Still have questions? We're here to help!
          </p>
          <a 
            href="#contact" 
            className="btn-secondary inline-block"
          >
            CONTACT US
          </a>
        </div>
      </div>
    </section>
  )
}