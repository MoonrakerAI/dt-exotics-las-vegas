'use client'

import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Car } from '@/app/data/cars'

interface CarGalleryModalProps {
  car: Car | null
  isOpen: boolean
  onClose: () => void
}

export default function CarGalleryModal({ car, isOpen, onClose }: CarGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mediaItems, setMediaItems] = useState<string[]>([])

  useEffect(() => {
    console.log('Modal state changed:', { isOpen, car: car?.model })
  }, [isOpen, car])

  useEffect(() => {
    if (car && isOpen) {
      // Combine main image and gallery images
      const allMedia = [car.images.main, ...car.images.gallery].filter(Boolean)
      setMediaItems(allMedia)
      setCurrentIndex(0)
    }
  }, [car, isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !car) return null

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl mx-4 animate-slideIn">
        <div className="bg-dark-metal border border-neon-blue/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.3)]">
          {/* Header */}
          <div className="bg-black/50 px-6 py-4 flex items-center justify-between border-b border-gray-800">
            <div>
              <h2 className="text-2xl font-tech font-bold text-white">
                {car.brand} {car.model}
              </h2>
              <p className="text-neon-blue font-tech">{car.year}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200 group"
            >
              <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
            </button>
          </div>
          
          {/* Gallery Content */}
          <div className="relative aspect-video bg-black">
            {mediaItems.length > 0 ? (
              <>
                {/* Main Display */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={mediaItems[currentIndex]} 
                    alt={`${car.brand} ${car.model} - Image ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                  
                  {/* Navigation Arrows */}
                  {mediaItems.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevious}
                        className="absolute left-4 p-2 bg-black/50 hover:bg-black/70 rounded-full border border-gray-600 hover:border-neon-blue transition-all duration-200 group"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-neon-blue" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="absolute right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full border border-gray-600 hover:border-neon-blue transition-all duration-200 group"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-neon-blue" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnail Navigation */}
                {mediaItems.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
                    <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide">
                      {mediaItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all duration-200 ${
                            index === currentIndex 
                              ? 'border-neon-blue shadow-[0_0_10px_rgba(0,255,255,0.5)]' 
                              : 'border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <img 
                            src={item} 
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 font-tech">No images available</p>
              </div>
            )}
          </div>
          
          {/* Car Details */}
          <div className="p-6 border-t border-gray-800">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Power</p>
                <p className="text-2xl font-tech font-bold text-white">{car.stats.horsepower} HP</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">Top Speed</p>
                <p className="text-2xl font-tech font-bold text-white">{car.stats.topSpeed} km/h</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-1">0-60 mph</p>
                <p className="text-2xl font-tech font-bold text-white">{car.stats.acceleration}s</p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-3xl font-tech font-bold text-neon-blue mb-2">
                ${car.price.daily}/day
              </p>
              <a 
                href="#contact" 
                onClick={onClose}
                className="btn-primary inline-block mt-4"
              >
                BOOK THIS CAR
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}