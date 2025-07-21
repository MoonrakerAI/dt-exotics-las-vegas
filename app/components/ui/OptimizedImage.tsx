'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

interface OptimizedImageProps {
  src: string | { 
    original: string; 
    thumbnail?: string; 
    medium?: string; 
    optimized?: string; 
  }
  alt: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  quality?: 'thumbnail' | 'medium' | 'optimized' | 'original'
  lazy?: boolean
  fallbackSrc?: string
  onLoad?: () => void
  onError?: () => void
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  quality = 'optimized',
  lazy = true,
  fallbackSrc = '/cars/fallback/generic-car.jpg',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState('')
  const [intersected, setIntersected] = useState(!lazy || priority)
  const imgRef = useRef<HTMLImageElement>(null)

  // Determine the best image source based on quality preference
  const getImageSrc = () => {
    if (typeof src === 'string') {
      return src
    }

    // Use the requested quality, fallback to best available
    return src[quality] || src.optimized || src.medium || src.thumbnail || src.original
  }

  // Progressive image loading - start with thumbnail, upgrade to higher quality
  useEffect(() => {
    if (!intersected) return

    if (typeof src === 'object' && src.thumbnail && quality !== 'thumbnail') {
      // Start with thumbnail for fast loading
      setCurrentSrc(src.thumbnail)
      
      // Then upgrade to requested quality
      const img = new Image()
      img.onload = () => {
        setCurrentSrc(getImageSrc())
        setLoading(false)
        onLoad?.()
      }
      img.onerror = () => {
        setError(true)
        setLoading(false)
        onError?.()
      }
      img.src = getImageSrc()
    } else {
      setCurrentSrc(getImageSrc())
    }
  }, [intersected, src, quality])

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || !imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersected(true)
          observer.disconnect()
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before the image comes into view
      }
    )

    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [lazy, priority])

  const handleImageLoad = () => {
    setLoading(false)
    onLoad?.()
  }

  const handleImageError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setError(false) // Reset error state for fallback
    } else {
      setError(true)
      setLoading(false)
      onError?.()
    }
  }

  const baseClasses = `transition-all duration-300 ${className}`
  const containerClasses = `relative overflow-hidden ${className}`

  if (!intersected && lazy && !priority) {
    return (
      <div 
        ref={imgRef}
        className={containerClasses}
        style={{ width, height }}
      >
        <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${containerClasses}`} style={{ width, height }}>
      {loading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center text-gray-400 z-10">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-sm">Failed to load image</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={`${baseClasses} ${loading ? 'opacity-0' : 'opacity-100'}`}
          style={{ width, height }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
    </div>
  )
}

// Helper hook for responsive image sizes
export function useResponsiveImageSize() {
  const [size, setSize] = useState<'thumbnail' | 'medium' | 'optimized' | 'original'>('optimized')

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setSize('medium')
      } else if (width < 1024) {
        setSize('optimized')
      } else {
        setSize('original')
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return size
}

// Gallery component with optimized loading
interface ImageGalleryProps {
  images: Array<{
    original: string
    thumbnail?: string
    medium?: string
    optimized?: string
  }>
  className?: string
  itemClassName?: string
  onImageClick?: (index: number) => void
}

export function ImageGallery({ 
  images, 
  className = '', 
  itemClassName = '',
  onImageClick 
}: ImageGalleryProps) {
  const responsiveSize = useResponsiveImageSize()

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div 
          key={index}
          className={`aspect-square cursor-pointer hover:scale-105 transition-transform duration-200 ${itemClassName}`}
          onClick={() => onImageClick?.(index)}
        >
          <OptimizedImage
            src={image}
            alt={`Gallery image ${index + 1}`}
            quality={index < 4 ? responsiveSize : 'thumbnail'} // Load first 4 in high quality
            priority={index < 2} // Prioritize first 2 images
            className="w-full h-full object-cover rounded-lg"
            lazy={index >= 2} // Lazy load after first 2
          />
        </div>
      ))}
    </div>
  )
} 