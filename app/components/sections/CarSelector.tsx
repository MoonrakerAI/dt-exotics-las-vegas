'use client'

import { useState, useRef, useEffect } from 'react'
import { cars } from '@/app/data/cars'
import CarGalleryModal from '@/app/components/modals/CarGalleryModal'

export default function CarSelector() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [selectedCar, setSelectedCar] = useState<typeof cars[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const playSound = (car: typeof cars[0], type: 'startup' | 'rev') => {
    if (audioRef.current) {
      audioRef.current.src = type === 'startup' 
        ? car.audio.startup || '' 
        : car.audio.rev || ''
      audioRef.current.play()
    }
  }

  const openCarModal = (car: typeof cars[0]) => {
    console.log('Opening modal for car:', car.model)
    setSelectedCar(car)
    setIsModalOpen(true)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 px-4 relative" id="cars">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-tech font-black mb-4">
            <span className="text-white">OUR</span>{' '}
            <span className="neon-text">FLEET</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Whether you're looking for a luxury car rental in Las Vegas for a night out, a business 
            trip, or just for fun, DT EXOTICS LV has you covered.
          </p>
        </div>

        {/* Car Grid - 3 per row */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div
              key={car.id}
              className="relative group transition-all duration-500"
            >
              {/* Car Image - Floating above stats container */}
              <div 
                className="relative h-48 mb-4 z-20 cursor-pointer"
                onClick={() => openCarModal(car)}
              >
                <div className="relative h-full" style={{ backgroundColor: '#0A0A0A' }}>
                  {car.images.main && (
                    <img 
                      src={car.images.main} 
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                </div>
              </div>

              {/* Car Info and Stats Container with rounded corners and glow */}
              <div className="bg-dark-metal/50 relative transition-all duration-500 rounded-2xl border border-gray-600/30 group-hover:border-neon-blue group-hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                {/* Clickable area for Car Info and Stats */}
                <div 
                  className="cursor-pointer"
                  onClick={() => openCarModal(car)}
                >
                  {/* Car Info */}
                  <div className="px-8 pt-6 pb-2">
                    <h3 className="text-xl font-tech font-bold text-white uppercase">
                      {car.model}
                    </h3>
                    <p className="text-neon-blue text-lg font-tech">{car.year}</p>
                  </div>

                  {/* Stats */}
                  <div className="px-8 pb-8 space-y-4">
                    {/* Power */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Power</span>
                        <span className="text-white font-bold">{car.stats.horsepower} HP</span>
                      </div>
                      <div className="h-2 bg-metal-gray rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r from-neon-blue to-neon-blue/50 transition-all duration-1000 delay-200 ${
                            isVisible ? 'w-full' : 'w-0'
                          }`}
                          style={{ 
                            width: isVisible ? `${(car.stats.horsepower / 800) * 100}%` : '0%'
                          }}
                        />
                      </div>
                    </div>

                    {/* Speed */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Speed</span>
                        <span className="text-white font-bold">{car.stats.topSpeed} km/h</span>
                      </div>
                      <div className="h-2 bg-metal-gray rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r from-neon-blue to-neon-blue/50 transition-all duration-1000 delay-400 ${
                            isVisible ? 'w-full' : 'w-0'
                          }`}
                          style={{ 
                            width: isVisible ? `${(car.stats.topSpeed / 350) * 100}%` : '0%'
                          }}
                        />
                      </div>
                    </div>

                    {/* 0-60 */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">0-60 mph</span>
                        <span className="text-white font-bold">{car.stats.acceleration}s</span>
                      </div>
                      <div className="h-2 bg-metal-gray rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r from-neon-blue to-neon-blue/50 transition-all duration-1000 delay-600 ${
                            isVisible ? 'w-full' : 'w-0'
                          }`}
                          style={{ 
                            width: isVisible ? `${((6 - car.stats.acceleration) / 6) * 100}%` : '0%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sound Controls */}
                <div className="px-8 pb-8">
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playSound(car, 'startup')
                      }}
                      className="flex-1 py-2 px-3 bg-metal-gray hover:bg-metal-gray/70 rounded transition-all duration-200 group"
                    >
                      <span className="text-xs font-tech flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        Startup
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        playSound(car, 'rev')
                      }}
                      className="flex-1 py-2 px-3 bg-metal-gray hover:bg-metal-gray/70 rounded transition-all duration-200 group"
                    >
                      <span className="text-xs font-tech flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        Rev
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <audio ref={audioRef} />
      </div>
      
      {/* Car Gallery Modal */}
      <CarGalleryModal 
        car={selectedCar}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  )
}