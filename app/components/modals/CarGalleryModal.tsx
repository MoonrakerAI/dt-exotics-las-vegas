'use client'

import { useEffect, useState, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Play } from 'lucide-react'
import { Car } from '@/app/data/cars'

interface CarGalleryModalProps {
  car: Car | null
  isOpen: boolean
  onClose: () => void
}

export default function CarGalleryModal({ car, isOpen, onClose }: CarGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mediaItems, setMediaItems] = useState<string[]>([])
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastTap, setLastTap] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('Modal state changed:', { isOpen, car: car?.model })
  }, [isOpen, car])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (car && isOpen) {
      // Combine gallery images and video (if available)
      const galleryMedia: string[] = []
      
      // Add gallery images
      car.images.gallery.filter(Boolean).forEach(image => {
        galleryMedia.push(image)
      })
      
      // Add video if available (showcase video goes at the end)
      if (car.videos.showcase) {
        galleryMedia.push(car.videos.showcase)
      }
      
      setMediaItems(galleryMedia)
      setCurrentIndex(0)
      // Reset zoom and pan when modal opens or car changes
      setZoom(1)
      setPanX(0)
      setPanY(0)
    }
  }, [car, isOpen])

  // Reset zoom and pan when image changes
  useEffect(() => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }, [currentIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, mediaItems.length])

  if (!isOpen || !car) return null

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1))
  }

  // Zoom functions
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 4)) // Max zoom 4x
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 1)) // Min zoom 1x
  }

  const handleZoomReset = () => {
    setZoom(1)
    setPanX(0)
    setPanY(0)
  }

  // Mouse/touch pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanX(e.clientX - dragStart.x)
      setPanY(e.clientY - dragStart.y)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Double-tap zoom for mobile
  const handleDoubleTap = () => {
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (zoom === 1) {
        setZoom(2)
      } else {
        handleZoomReset()
      }
    }
    setLastTap(now)
  }

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) {
      // Handle panning when zoomed
      const touch = e.targetTouches[0]
      setDragStart({ x: touch.clientX - panX, y: touch.clientY - panY })
      setIsDragging(true)
    } else {
      // Handle swipe navigation when not zoomed
      setTouchEnd(null)
      setTouchStart(e.targetTouches[0].clientX)
    }
    
    // Handle double-tap
    handleDoubleTap()
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (zoom > 1 && isDragging) {
      // Handle panning
      const touch = e.targetTouches[0]
      setPanX(touch.clientX - dragStart.x)
      setPanY(touch.clientY - dragStart.y)
    } else if (zoom === 1) {
      // Handle swipe detection
      setTouchEnd(e.targetTouches[0].clientX)
    }
  }

  const onTouchEnd = () => {
    if (zoom > 1) {
      setIsDragging(false)
    } else {
      // Handle swipe navigation
      if (!touchStart || !touchEnd) return
      const distance = touchStart - touchEnd
      const isLeftSwipe = distance > 50
      const isRightSwipe = distance < -50

      if (isLeftSwipe) {
        handleNext()
      } else if (isRightSwipe) {
        handlePrevious()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl mx-2 sm:mx-4 animate-slideIn max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="bg-dark-metal border border-neon-blue/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.3)] flex flex-col h-full">
          {/* Header */}
          <div className="bg-black/50 px-6 py-4 flex items-center justify-between border-b border-gray-800 flex-shrink-0">
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
          <div className="flex flex-col bg-black flex-1 min-h-0">
            {mediaItems.length > 0 ? (
              <>
                {/* Main Display */}
                <div 
                  ref={containerRef}
                  className="relative flex-1 flex items-center justify-center p-4 pb-0 min-h-0 sm:min-h-[200px] overflow-hidden"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    maxHeight: isMobile ? 'calc(95vh - 320px)' : 'calc(90vh - 280px)',
                    minHeight: '150px',
                    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                  }}
                >
                  {/* Render image or video based on file type */}
                  {mediaItems[currentIndex]?.includes('.mp4') || mediaItems[currentIndex]?.includes('.webm') ? (
                    <video 
                      controls
                      className="max-w-full max-h-full object-contain select-none"
                      style={{ maxHeight: 'calc(100% - 40px)' }}
                    >
                      <source src={mediaItems[currentIndex]} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img 
                      ref={imageRef}
                      src={mediaItems[currentIndex]} 
                      alt={`${car.brand} ${car.model} - Image ${currentIndex + 1}`}
                      className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                      draggable={false}
                      loading="eager"
                      decoding="async"
                      style={{
                        transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
                        transformOrigin: 'center center'
                      }}
                    />
                  )}
                  
                  {/* Preload next and previous images for smoother navigation */}
                  {mediaItems.length > 1 && (
                    <>
                      {/* Preload next image */}
                      <link 
                        rel="preload" 
                        as="image" 
                        href={mediaItems[(currentIndex + 1) % mediaItems.length]} 
                      />
                      {/* Preload previous image */}
                      <link 
                        rel="preload" 
                        as="image" 
                        href={mediaItems[(currentIndex - 1 + mediaItems.length) % mediaItems.length]} 
                      />
                    </>
                  )}
                  
                  {/* Navigation Arrows - only show when not zoomed */}
                  {mediaItems.length > 1 && zoom === 1 && (
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

                  {/* Zoom Controls - only show for images */}
                  {!(mediaItems[currentIndex]?.includes('.mp4') || mediaItems[currentIndex]?.includes('.webm')) && (
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 4}
                        className="p-2 bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full border border-gray-600 hover:border-neon-blue transition-all duration-200 group"
                      >
                        <ZoomIn className="w-5 h-5 text-gray-400 group-hover:text-neon-blue" />
                      </button>
                      <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 1}
                        className="p-2 bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full border border-gray-600 hover:border-neon-blue transition-all duration-200 group"
                      >
                        <ZoomOut className="w-5 h-5 text-gray-400 group-hover:text-neon-blue" />
                      </button>
                      {zoom > 1 && (
                        <button
                          onClick={handleZoomReset}
                          className="p-2 bg-black/50 hover:bg-black/70 rounded-full border border-gray-600 hover:border-neon-blue transition-all duration-200 group"
                        >
                          <RotateCcw className="w-5 h-5 text-gray-400 group-hover:text-neon-blue" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Zoom indicator */}
                  {zoom > 1 && (
                    <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/70 rounded-full border border-gray-600">
                      <span className="text-neon-blue text-sm font-tech">{Math.round(zoom * 100)}%</span>
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Navigation */}
                {mediaItems.length > 1 && (
                  <div className="flex-shrink-0 bg-black/70 p-4 border-t border-gray-800">
                    <div className="flex gap-2 justify-center overflow-x-auto scrollbar-hide">
                      {mediaItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded overflow-hidden border-2 transition-all duration-200 ${
                            index === currentIndex 
                              ? 'border-neon-blue shadow-[0_0_10px_rgba(0,255,255,0.5)]' 
                              : 'border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {item.includes('.mp4') || item.includes('.webm') ? (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                          ) : (
                            <img 
                              src={item} 
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-400 font-tech">No images available</p>
              </div>
            )}
          </div>
          
          {/* Car Details */}
          <div className="p-6 border-t border-gray-800 flex-shrink-0">
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
                href={`/book-rental?car=${car.id}`}
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