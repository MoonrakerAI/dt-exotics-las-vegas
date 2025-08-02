'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    google: any
    initMap?: () => void
    googleMapsCallback?: () => void
  }
}

export default function CustomGoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApiLoaded, setIsApiLoaded] = useState(false)

  // Check if Google Maps API is already loaded
  const checkGoogleMapsLoaded = () => {
    return typeof window !== 'undefined' && window.google && window.google.maps
  }

  // Load Google Maps API script
  const loadGoogleMapsScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (checkGoogleMapsLoaded()) {
        resolve()
        return
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        reject(new Error('Google Maps API key is not configured'))
        return
      }

      // Create callback function name
      const callbackName = 'googleMapsCallback'
      
      // Set up callback
      window[callbackName] = () => {
        setIsApiLoaded(true)
        resolve()
      }

      // Create script element
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&libraries=geometry,places&v=weekly`
      script.async = true
      script.defer = true
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'))
      }

      document.head.appendChild(script)
    })
  }

  // Custom map styling with neon blue theme
  const mapStyles = [
    {
      "featureType": "all",
      "elementType": "geometry",
      "stylers": [
        { "color": "#1a1a1a" }
      ]
    },
    {
      "featureType": "all",
      "elementType": "labels.text.fill",
      "stylers": [
        { "color": "#ffffff" }
      ]
    },
    {
      "featureType": "all",
      "elementType": "labels.text.stroke",
      "stylers": [
        { "color": "#000000" },
        { "lightness": 13 }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry.fill",
      "stylers": [
        { "color": "#000000" }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [
        { "color": "#00FFFF" },
        { "lightness": 14 },
        { "weight": 1.4 }
      ]
    },
    {
      "featureType": "landscape",
      "elementType": "all",
      "stylers": [
        { "color": "#0a0a0a" }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        { "color": "#1a1a1a" },
        { "lightness": 5 }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [
        { "color": "#00FFFF" },
        { "lightness": -10 }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.stroke",
      "stylers": [
        { "color": "#00CCCC" },
        { "lightness": 25 },
        { "weight": 0.2 }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        { "color": "#00AAAA" },
        { "lightness": -20 }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry",
      "stylers": [
        { "color": "#008888" },
        { "lightness": -17 }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "geometry",
      "stylers": [
        { "color": "#2f2f2f" },
        { "lightness": -10 }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        { "color": "#0f1419" },
        { "lightness": -25 }
      ]
    }
  ]

  // Business location coordinates (DT Exotics - 9620 Las Vegas Blvd S)
  const businessLocation = {
    lat: 36.015201,
    lng: -115.207215
  }

  // Initialize map with proper error handling
  const initializeMap = async () => {
    try {
      if (!mapRef.current || !window.google?.maps) {
        throw new Error('Google Maps API not available')
      }

      setError(null)
      
      // Create map with custom styling
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 16,
        center: businessLocation,
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        backgroundColor: '#0a0a0a',
        clickableIcons: false,
        gestureHandling: 'cooperative',
        // Add restriction to prevent excessive API calls
        restriction: {
          latLngBounds: {
            north: 36.3,
            south: 36.0,
            west: -115.4,
            east: -114.9
          },
          strictBounds: false
        }
      })

      mapInstanceRef.current = map

      // Custom marker icon using DT Exotics black logo for better visibility
      const customMarker = {
        url: '/images/logo/DT Exotics Logo Icon Black.png',
        scaledSize: new window.google.maps.Size(48, 48),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(24, 24)
      }

      // Add marker
      const marker = new window.google.maps.Marker({
        position: businessLocation,
        map: map,
        title: 'DT Exotics Supercar Rentals',
        icon: customMarker,
        animation: window.google.maps.Animation.DROP,
        optimized: true // Optimize marker rendering
      })

      // Default Google Maps info window content (no custom styling)
      const infoWindowContent = `
        <div>
          <h3>DT Exotics Supercar Rentals</h3>
          <p>9620 Las Vegas Blvd S, Las Vegas, NV 89123</p>
          <p>Luxury Exotic Car Rentals</p>
          <p>Phone: (702) 518-0924</p>
          <p><a href="/book-rental" target="_blank">Book Online</a></p>
        </div>
      `

      // Create info window with default Google Maps behavior
      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
        disableAutoPan: false,
        maxWidth: 300
      })

      // Add click listener to marker
      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      // Open info window immediately and keep it open
      infoWindow.open(map, marker)
      
      // Ensure info window stays open (prevent accidental closing)
      infoWindow.addListener('closeclick', () => {
        setTimeout(() => {
          infoWindow.open(map, marker)
        }, 100)
      })

      setIsLoading(false)
      
    } catch (err) {
      console.error('Failed to initialize Google Maps:', err)
      setError(err instanceof Error ? err.message : 'Failed to load map')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadAndInitializeMap = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Check if already loaded
        if (checkGoogleMapsLoaded()) {
          await initializeMap()
          return
        }

        // Load the API
        await loadGoogleMapsScript()
        await initializeMap()
        
      } catch (err) {
        console.error('Google Maps loading error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load Google Maps')
        setIsLoading(false)
      }
    }

    loadAndInitializeMap()

    return () => {
      // Cleanup
      if (window.googleMapsCallback) {
        window.googleMapsCallback = undefined
      }
      if (mapInstanceRef.current) {
        // Properly cleanup map instance
        mapInstanceRef.current = null
      }
    }
  }, [])

  if (error) {
    return (
      <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-red-500/30 relative bg-gray-900/50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-red-400 text-lg mb-2">⚠️</div>
            <h3 className="text-red-400 font-semibold mb-2">Map Loading Error</h3>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm hover:bg-red-500/30 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-gray-600/30 relative">
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ background: '#0a0a0a' }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
            <span className="text-gray-300 text-sm">Loading Google Maps...</span>
          </div>
        </div>
      )}
      
      {/* API Key Warning */}
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 bg-yellow-900/80 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-yellow-400 text-lg mb-2">🔑</div>
            <h3 className="text-yellow-400 font-semibold mb-2">API Key Required</h3>
            <p className="text-gray-300 text-sm">Google Maps API key not configured</p>
          </div>
        </div>
      )}
    </div>
  )
}
