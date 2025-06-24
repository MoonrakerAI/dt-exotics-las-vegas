'use client'

import { Gem, Wine, UtensilsCrossed, Car } from 'lucide-react'

export default function VIPServicesSection() {
  const services = [
    {
      title: "Custom Jewelry Rental",
      icon: Gem,
      description: "Drip harder. From iced-out pieces to signature subtle flexes."
    },
    {
      title: "VIP Bottle Service",
      icon: Wine,
      description: "Skip the line, pop the bottles, own the night."
    },
    {
      title: "Restaurant Reservations", 
      icon: UtensilsCrossed,
      description: "We know the spots. You just show up hungry and fabulous."
    },
    {
      title: "Black Car Service",
      icon: Car, 
      description: "Chauffeured, polished, and always on time (because fashionably late is a choice)."
    }
  ]

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
            <span className="text-white">WANT TO GO</span>{' '}
            <span className="neon-text-magenta">ALL OUT?</span>
          </h2>
          
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Luxury isn't one-size-fits-all—so let's tailor the experience. Add-on options 
            include:
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div key={index} className="glass-panel bg-dark-metal/50 p-8 text-center group border border-gray-600/30 group-hover:border-neon-pink group-hover:shadow-[0_0_15px_rgba(255,0,255,0.3)] transition-all duration-700">
              {/* Icon with neon magenta outline */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-gray-600/30 group-hover:border-neon-pink flex items-center justify-center bg-dark-metal relative group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all duration-700">
                <div className="absolute inset-0 rounded-full bg-neon-pink/10 blur-xl group-hover:bg-neon-pink/30" />
                <service.icon className="w-10 h-10 text-neon-pink relative z-10" />
              </div>
              
              <h3 className="text-lg font-tech font-bold mb-4 text-white">
                {service.title}
              </h3>
              
              <p className="text-gray-300 text-sm leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-gray-300">
            Let us know what you need—and we'll make it happen like magic.
          </p>
        </div>
      </div>
    </section>
  )
}