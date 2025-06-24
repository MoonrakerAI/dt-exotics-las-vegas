'use client'

import { MessageCircle, Car, Calendar, Key } from 'lucide-react'

export default function ProcessSection() {
  const steps = [
    {
      number: "1",
      title: "SHOOT US A TEXT!",
      icon: MessageCircle,
      description: "No forms. No fuss. Just tap that button and slide into our DMs with what you're after. We'll take it from there—because luxury should never be a chore."
    },
    {
      number: "2", 
      title: "PICK YOUR DREAM RIDE",
      icon: Car,
      description: "Sleek? Savage? Something that screams \"watch me\" without saying a word? Our lineup is built to impress—just find the one that matches your mood, and we'll cue the engine."
    },
    {
      number: "3",
      title: "RESERVE YOUR DAY", 
      icon: Calendar,
      description: "We lock in your date, you prep your playlist. It's all smooth sailing from here. No drama, no delays—just pure, unapologetic indulgence."
    },
    {
      number: "4",
      title: "TAKE THE KEYS AND GO!",
      icon: Key, 
      description: "When reservation day arrives, your dream car will be polished and primed. Slide in, take the wheel, and own the city. It's your moment—make it unforgettable."
    }
  ]

  return (
    <section className="py-20 px-4 relative" id="process">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
            <span className="text-white">HOW IT</span>{' '}
            <span className="neon-text">WORKS</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Luxury Made Easy. Living life in the fast lane shouldn't come with speed bumps—so 
            we made it smooth, simple, and just a little bit extra.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center relative group">
              {/* Neon circle with icon */}
              <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-gray-600/30 group-hover:border-neon-blue flex items-center justify-center bg-dark-metal relative group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all duration-700">
                <div className="absolute inset-0 rounded-full bg-neon-blue/10 blur-xl group-hover:bg-neon-blue/30" />
                <step.icon className="w-10 h-10 text-neon-blue relative z-10" />
              </div>

              <h3 className="text-lg font-tech font-bold mb-4 text-white uppercase">
                {step.number}. {step.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed text-sm">
                {step.description}
              </p>

              {/* Connecting line for desktop */}
              {step.number !== "4" && (
                <div className="hidden xl:block absolute top-12 left-[60%] w-full h-0.5">
                  <div className="w-full h-full bg-gradient-to-r from-neon-blue/50 via-neon-blue/20 to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}