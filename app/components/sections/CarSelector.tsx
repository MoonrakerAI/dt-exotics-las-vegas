'use client'

import { useState, useRef, useEffect } from 'react'
import { Car } from '@/app/data/cars'
import CarGalleryModal from '@/app/components/modals/CarGalleryModal'

// Individual car card component with its own intersection observer
function CarCard({ car, onOpenModal, onPlaySound, playingAudio }: {
  car: Car
  onOpenModal: (car: Car) => void
  onPlaySound: (car: Car, type: 'startup' | 'rev') => void
  playingAudio: { carId: string; type: 'startup' | 'rev' } | null
}) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { 
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before the element is fully visible
      }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={cardRef}
      className="relative group transition-all duration-500"
    >
      {/* Car Image - Floating above stats container */}
      <div 
        className="relative h-48 mb-4 z-20 cursor-pointer"
        onClick={() => onOpenModal(car)}
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
          onClick={() => onOpenModal(car)}
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
                <span className="text-white font-bold">{Math.round(car.stats.topSpeed)} MPH</span>
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

            {/* Acceleration */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">0-60 MPH</span>
                <span className="text-white font-bold">{car.stats.acceleration}s</span>
              </div>
              <div className="h-2 bg-metal-gray rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r from-neon-blue to-neon-blue/50 transition-all duration-1000 delay-600 ${
                    isVisible ? 'w-full' : 'w-0'
                  }`}
                  style={{ 
                    width: isVisible ? `${(6 / car.stats.acceleration) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Engine Sound Buttons */}
        <div className="px-8 pb-6">
          <div className="flex gap-2 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPlaySound(car, 'startup')
              }}
              className={`flex-1 py-2 px-3 rounded transition-all duration-200 group ${
                playingAudio?.carId === car.id && playingAudio?.type === 'startup'
                  ? 'bg-neon-blue text-dark-gray'
                  : 'bg-metal-gray hover:bg-metal-gray/70'
              }`}
              disabled={playingAudio?.carId === car.id && playingAudio?.type === 'startup'}
            >
              <span className="text-xs font-tech flex items-center justify-center gap-2">
                {playingAudio?.carId === car.id && playingAudio?.type === 'startup' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Playing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    Startup
                  </>
                )}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPlaySound(car, 'rev')
              }}
              className={`flex-1 py-2 px-3 rounded transition-all duration-200 group ${
                playingAudio?.carId === car.id && playingAudio?.type === 'rev'
                  ? 'bg-neon-blue text-dark-gray'
                  : 'bg-metal-gray hover:bg-metal-gray/70'
              }`}
              disabled={playingAudio?.carId === car.id && playingAudio?.type === 'rev'}
            >
              <span className="text-xs font-tech flex items-center justify-center gap-2">
                {playingAudio?.carId === car.id && playingAudio?.type === 'rev' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Playing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    Rev
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Book Now Button */}
        <div className="px-8 pb-8">
          <a
            href={`/book-rental?car=${car.id}`}
            onClick={(e) => e.stopPropagation()}
            className="btn-primary w-full text-center block"
          >
            Book Now
          </a>
        </div>
      </div>
    </div>
  )
}

export default function CarSelector() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<{ carId: string; type: 'startup' | 'rev' } | null>(null)

  useEffect(() => {
    fetchCars()
  }, [])

  const fetchCars = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/cars')
      if (!response.ok) {
        throw new Error('Failed to fetch cars')
    }
      const data = await response.json()
      // Custom sort order for specific fleet arrangement
      const customSortOrder = [
        // Row 1: Most expensive (Lamborghini, McLaren, etc.)
        'lamborghini-h-2015', 'mclaren-720s', 'ferrari-488',
        // Row 2: 911, Cayman, Corvette
        'porsche-911', 'porsche-cayman', 'corvette-c8',
        // Row 3: Discovery (formerly Range Rover), G550, GLC
        'land-rover-discovery', 'mercedes-g550', 'mercedes-glc',
        // Row 4: S5, SQ8
        'audi-s5', 'audi-sq8'
      ]
      
      const sortedCars = (data.cars || [])
        .map((car: Car) => {
          // Rename Range Rover to Discovery
          if (car.model && car.model.toLowerCase().includes('range rover')) {
            return { ...car, model: car.model.replace(/Range Rover/gi, 'Discovery') }
          }
          return car
        })
        .sort((a: Car, b: Car) => {
          const aIndex = customSortOrder.indexOf(a.id)
          const bIndex = customSortOrder.indexOf(b.id)
          
          // If both cars are in the custom order, sort by their position
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex
          }
          
          // If only one car is in the custom order, prioritize it
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          
          // For cars not in custom order, sort by price (most expensive first)
          return b.price.daily - a.price.daily
        })
      setCars(sortedCars)
    } catch (err) {
      console.error('Error fetching cars:', err)
      setError('Failed to load vehicles. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Audio event handling is now done per-playback in playSound function

  const playSound = (car: Car, type: 'startup' | 'rev') => {
    if (audioRef.current) {
      const audioSrc = type === 'startup' ? car.audio.startup : car.audio.rev
      
      if (!audioSrc) {
        console.warn(`No ${type} audio available for ${car.brand} ${car.model}`)
        return
      }

      // Stop any currently playing audio
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      
      // Set new audio source and play
      audioRef.current.src = audioSrc
      setPlayingAudio({ carId: car.id, type })
      
      // Set up one-time event listeners for this specific playback
      const handleEnded = () => {
        console.log('Audio ended, stopping spinner')
        setPlayingAudio(null)
        cleanup()
      }
      
      const handleError = () => {
        console.log('Audio error, stopping spinner')
        setPlayingAudio(null)
        cleanup()
      }
      
      const handlePause = () => {
        console.log('Audio paused, stopping spinner')
        setPlayingAudio(null)
        cleanup()
      }
      
      const cleanup = () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handleEnded)
          audioRef.current.removeEventListener('error', handleError)
          audioRef.current.removeEventListener('pause', handlePause)
        }
        if (safetyTimeout) clearTimeout(safetyTimeout)
      }
      
      // Add event listeners
      audioRef.current.addEventListener('ended', handleEnded)
      audioRef.current.addEventListener('error', handleError)
      audioRef.current.addEventListener('pause', handlePause)
      
      // Safety timeout to stop spinner after 30 seconds (in case audio events fail)
      const safetyTimeout = setTimeout(() => {
        console.log('Safety timeout reached, stopping spinner')
        setPlayingAudio(null)
        cleanup()
      }, 30000)
      
      audioRef.current.play().then(() => {
        console.log('Audio started playing successfully')
      }).catch((error) => {
        console.error('Audio playback failed:', error)
        setPlayingAudio(null)
        cleanup()
      })
    }
  }

  const openCarModal = (car: Car) => {
    console.log('Opening modal for car:', car.model)
    setSelectedCar(car)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <section className="py-20 px-4 relative" id="cars">
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
          
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mb-4"></div>
            <p className="text-gray-400">Loading our amazing fleet...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-20 px-4 relative" id="cars">
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
          
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchCars}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 px-4 relative" id="cars">
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

        {cars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No vehicles available at the moment.</p>
            <p className="text-sm text-gray-500">Check back soon or contact us directly!</p>
          </div>
        ) : (
          /* Car Grid - 3 per row */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onOpenModal={openCarModal}
              onPlaySound={playSound}
              playingAudio={playingAudio}
            />
          ))}
        </div>
        )}

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