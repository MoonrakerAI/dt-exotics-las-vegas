'use client'

import { useState, useEffect } from 'react'

export default function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-dark-gray/50 z-10" />
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        >
          <source src="/videos/hero/Hero Background.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-20 flex h-full items-center justify-center px-4 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 
            className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-tech font-black mb-4 sm:mb-6 transition-all duration-1000 transform leading-tight ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <span className="neon-text">OWN</span>{' '}
            <span className="text-white">THE NIGHT</span>
          </h1>
          
          <p 
            className={`text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-8 sm:mb-12 font-light transition-all duration-1000 delay-300 transform max-w-5xl mx-auto leading-relaxed ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            Unleash the beast. Experience Las Vegas behind the wheel of the world's most exclusive supercars.
          </p>

          <div 
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-500 transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <a href="#cars" className="btn-primary inline-block">
              EXPLORE OUR FLEET
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

      {/* Subtle fade transition */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-[#0A0A0A] pointer-events-none" />
    </section>
  )
}