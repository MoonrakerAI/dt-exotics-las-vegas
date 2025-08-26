'use client'

import { useEffect, useState, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react'
import { Car } from '@/app/data/cars'
import { extractYouTubeVideoId, getYouTubeThumbnailUrl, isYouTubeUrl, getYouTubeEmbedUrl } from '@/app/lib/youtube-utils'

interface CarGalleryModalProps {
  car: Car | null
  isOpen: boolean
  onClose: () => void
}

export default function CarGalleryModal({ car, isOpen, onClose }: CarGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mediaItems, setMediaItems] = useState<string[]>([])
  const [mediaTypes, setMediaTypes] = useState<('image' | 'video' | 'youtube')[]>([])
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({})
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isFullPageZoom, setIsFullPageZoom] = useState(false)
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
      console.log('Car data in modal:', car)
      console.log('Car videos:', car.videos)
      
      // Combine gallery images and videos (if available)
      const galleryMedia: string[] = []
      const galleryTypes: ('image' | 'video' | 'youtube')[] = []
      
      // Add gallery images
      car.images.gallery.filter(Boolean).forEach(image => {
        galleryMedia.push(image)
        galleryTypes.push('image')
      })
      
      // Add local video if available
      if (car.videos.showcase && !isYouTubeUrl(car.videos.showcase)) {
        console.log('Adding local video to gallery:', car.videos.showcase)
        galleryMedia.push(car.videos.showcase)
        galleryTypes.push('video')
      }
      
      // Add YouTube video if available
      if (car.videos.youtube) {
        const videoId = extractYouTubeVideoId(car.videos.youtube)
        if (videoId) {
          console.log('Adding YouTube video to gallery:', car.videos.youtube)
          // Use thumbnail URL for display, but store original URL for playback
          galleryMedia.push(car.videos.youtube)
          galleryTypes.push('youtube')
        } else {
          console.log('Failed to extract video ID from:', car.videos.youtube)
        }
      } else {
        console.log('No YouTube video found in car data')
      }
      
      console.log('Final gallery media items:', galleryMedia)
      console.log('Final gallery media types:', galleryTypes)
      
      // Clear previous loading states and reset everything cleanly
      setImageLoadingStates({})
      setCurrentIndex(0)
      setIsFullPageZoom(false)
      
      // Clear any stale image references
      if (imageRef.current) {
        imageRef.current.src = ''
        imageRef.current.onload = null
        imageRef.current.onerror = null
      }
      
      // Set new media items after cleanup
      setMediaItems(galleryMedia)
      setMediaTypes(galleryTypes)
      
      // Preload first few images for smooth experience
      galleryMedia.slice(0, 3).forEach((item, index) => {
        if (galleryTypes[index] === 'image') {
          const img = new Image()
          img.onload = () => {
            setImageLoadingStates(prev => ({ ...prev, [item]: true }))
          }
          img.src = item
        }
      })
    }
  }, [car, isOpen])

  // Don't reset fullscreen when navigating in fullscreen mode
  // This effect is removed to maintain fullscreen state during navigation

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

  // Navigation handlers that maintain fullscreen state
  const handlePreviousInFullscreen = () => {
    handlePrevious()
    // Keep fullscreen state active
  }

  const handleNextInFullscreen = () => {
    handleNext()
    // Keep fullscreen state active
  }

  // Full page zoom functions
  const handleFullPageZoom = () => {
    setIsFullPageZoom(true)
  }

  const handleCloseFullPageZoom = () => {
    setIsFullPageZoom(false)
  }

  // Image click handler for full page zoom
  const handleImageClick = () => {
    if (mediaTypes[currentIndex] === 'image') {
      handleFullPageZoom()
    }
  }

  // Double-tap for full page zoom on mobile
  const handleDoubleTap = () => {
    const now = Date.now()
    const DOUBLE_TAP_DELAY = 300
    
    if (now - lastTap < DOUBLE_TAP_DELAY && mediaTypes[currentIndex] === 'image') {
      handleFullPageZoom()
    }
    setLastTap(now)
  }

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    // Handle swipe navigation
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    
    // Handle double-tap
    handleDoubleTap()
  }

  const onTouchMove = (e: React.TouchEvent) => {
    // Handle swipe detection
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ top: '100px' }}>
      {/* Backdrop */}
      <div 
        className="absolute bg-black/80 backdrop-blur-sm animate-fadeIn"
        style={{ 
          top: '-100px',
          left: '0',
          right: '0',
          bottom: '0'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl mx-2 sm:mx-4 animate-slideIn flex flex-col" style={{ 
        maxHeight: 'calc(100vh - 120px)',
        marginTop: '10px',
        marginBottom: '10px'
      }}>
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
                  style={{
                    maxHeight: isMobile ? 'calc(100vh - 420px)' : 'calc(100vh - 380px)',
                    minHeight: '150px',
                    cursor: 'default'
                  }}
                >
                  {/* Render content based on media type */}
                  {mediaTypes[currentIndex] === 'youtube' ? (
                    // YouTube video iframe
                    <div className="w-full h-full flex items-center justify-center">
                      <iframe
                        src={getYouTubeEmbedUrl(extractYouTubeVideoId(mediaItems[currentIndex]) || '')}
                        className="w-full h-full max-w-full max-h-full"
                        style={{ maxHeight: 'calc(100% - 40px)', aspectRatio: '16/9' }}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${car.brand} ${car.model} Video`}
                      />
                    </div>
                  ) : mediaTypes[currentIndex] === 'video' ? (
                    // Local video file
                    <video 
                      controls
                      autoPlay={false}
                      muted
                      className="max-w-full max-h-full object-contain select-none"
                      style={{ maxHeight: 'calc(100% - 40px)' }}
                    >
                      <source src={mediaItems[currentIndex]} type="video/mp4" />
                      <source src={mediaItems[currentIndex]} type="video/webm" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    // Image
                  <img 
                    ref={imageRef}
                    src={mediaItems[currentIndex]} 
                    alt={`${car.brand} ${car.model} - Image ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain select-none cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    draggable={false}
                    loading="eager"
                    decoding="async"
                    onClick={handleImageClick}
                    onLoad={() => {
                      setImageLoadingStates(prev => ({ ...prev, [mediaItems[currentIndex]]: true }))
                    }}
                    onError={() => {
                      console.error('Failed to load image:', mediaItems[currentIndex])
                    }}
                    style={{
                      opacity: imageLoadingStates[mediaItems[currentIndex]] ? 1 : 0,
                      transition: 'opacity 0.2s ease-in-out'
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

                  {/* Full Page Zoom Button - only show for images */}
                  {mediaTypes[currentIndex] === 'image' && (
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={handleFullPageZoom}
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-full border border-gray-600 hover:border-neon-blue transition-all duration-200 group"
                      title="View full size"
                    >
                      <Maximize2 className="w-5 h-5 text-gray-400 group-hover:text-neon-blue" />
                    </button>
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
                          {mediaTypes[index] === 'youtube' ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={getYouTubeThumbnailUrl(extractYouTubeVideoId(item) || '')}
                                alt={`YouTube Video ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : mediaTypes[index] === 'video' ? (
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
                <p className="text-2xl font-tech font-bold text-white">{Math.round(car.stats.topSpeed)} MPH</p>
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
      
      {/* Full Page Zoom Modal */}
      {isFullPageZoom && (
        <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={handleCloseFullPageZoom}
            className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full border border-gray-600 hover:border-neon-blue transition-all duration-200 group"
          >
            <X className="w-6 h-6 text-gray-400 group-hover:text-white" />
          </button>
          
          {/* Navigation arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={handlePreviousInFullscreen}
                className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full border border-gray-600 hover:border-neon-blue transition-all duration-200 group"
              >
                <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-neon-blue" />
              </button>
              <button
                onClick={handleNextInFullscreen}
                className="absolute right-16 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full border border-gray-600 hover:border-neon-blue transition-all duration-200 group"
              >
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-neon-blue" />
              </button>
            </>
          )}
          
          {/* Full size image */}
          <img 
            src={mediaItems[currentIndex]} 
            alt={`${car.brand} ${car.model} - Full Size Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
            onClick={handleCloseFullPageZoom}
            style={{ cursor: 'zoom-out' }}
          />
          
          {/* Image counter */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full border border-gray-600">
              <span className="text-white text-sm font-tech">
                {currentIndex + 1} / {mediaItems.length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}