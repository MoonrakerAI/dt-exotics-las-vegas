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

  // Business location coordinates
  const businessLocation = {
    lat: 36.1699,
    lng: -115.1398
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
        zoom: 12,
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

      // Standard Google info window content with dark theme (no white border)
      const infoWindowContent = `
        <div style="
          background: #1a1a1a;
          color: white;
          font-family: 'Roboto', Arial, sans-serif;
          padding: 0;
          border-radius: 8px;
          overflow: hidden;
          min-width: 250px;
          border: none;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
          margin: 0;
        ">
          <!-- Business Header -->
          <div style="
            padding: 16px;
            border-bottom: 1px solid #333;
          ">
            <h3 style="
              margin: 0 0 4px 0;
              font-size: 16px;
              font-weight: 500;
              color: white;
            ">DT Exotics Supercar Rentals</h3>
            <div style="
              display: flex;
              align-items: center;
              margin: 4px 0;
            ">
              <span style="color: #ffa500; margin-right: 4px;">★★★★★</span>
              <span style="color: #999; font-size: 13px;">5.0 (Google Reviews)</span>
            </div>
            <p style="
              margin: 4px 0 0 0;
              color: #ccc;
              font-size: 13px;
            ">Luxury Exotic Car Rentals</p>
          </div>
          
          <!-- Address -->
          <div style="
            padding: 12px 16px;
            border-bottom: 1px solid #333;
          ">
            <div style="
              display: flex;
              align-items: center;
              color: #ccc;
              font-size: 13px;
            ">
              <span style="margin-right: 8px;">📍</span>
              <span>9620 Las Vegas Blvd S, Las Vegas, NV 89123</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="
            padding: 12px 16px;
            display: flex;
            gap: 8px;
          ">
            <a href="https://www.google.com/maps/dir//DT+Exotics+Supercar+Rentals" target="_blank" style="
              background: #333;
              color: white;
              padding: 8px 12px;
              border-radius: 4px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 500;
              flex: 1;
              text-align: center;
              border: 1px solid #555;
            ">Directions</a>
            <a href="sms:+17025180924" style="
              background: #1a73e8;
              color: white;
              padding: 8px 12px;
              border-radius: 4px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 500;
              flex: 1;
              text-align: center;
            ">Text Us</a>
          </div>
          
          <!-- Additional Info -->
          <div style="
            padding: 8px 16px 12px 16px;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #333;
          ">
            <div style="margin-bottom: 4px;">📞 (702) 518-0924</div>
            <div>🌐 <a href="/book-rental" style="color: #1a73e8; text-decoration: none;">Book Online</a></div>
          </div>
        </div>
      `

      // Create info window with custom positioning and styling
      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
        disableAutoPan: false,
        maxWidth: 300,
        pixelOffset: new window.google.maps.Size(150, -50) // Position towards top-right
      })

      // Override Google's default info window styling to remove white border
      window.google.maps.event.addListener(infoWindow, 'domready', () => {
        const iwOuter = document.querySelector('.gm-style-iw') as HTMLElement
        const iwBackground = document.querySelector('.gm-style-iw-d') as HTMLElement
        const iwCloseBtn = document.querySelector('.gm-ui-hover-effect') as HTMLElement
        
        if (iwOuter) {
          iwOuter.style.background = 'transparent'
          iwOuter.style.border = 'none'
          iwOuter.style.boxShadow = 'none'
        }
        
        if (iwBackground) {
          iwBackground.style.background = 'transparent'
          iwBackground.style.border = 'none'
          iwBackground.style.boxShadow = 'none'
          iwBackground.style.overflow = 'visible'
        }
        
        // Style the close button to match dark theme
        if (iwCloseBtn) {
          iwCloseBtn.style.background = '#333'
          iwCloseBtn.style.borderRadius = '50%'
          iwCloseBtn.style.width = '24px'
          iwCloseBtn.style.height = '24px'
          iwCloseBtn.style.top = '8px'
          iwCloseBtn.style.right = '8px'
        }
        
        // Remove the white background and border from the info window container
        const iwContainer = document.querySelector('.gm-style-iw-c') as HTMLElement
        if (iwContainer) {
          iwContainer.style.background = 'transparent'
          iwContainer.style.border = 'none'
          iwContainer.style.borderRadius = '8px'
          iwContainer.style.boxShadow = 'none'
          iwContainer.style.padding = '0'
        }
        
        // Remove the tail/pointer styling
        const iwTail = document.querySelector('.gm-style-iw-t') as HTMLElement
        if (iwTail) {
          iwTail.style.display = 'none'
        }
      })

      // Add click listener to marker
      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      // Auto-open info window after a short delay
      setTimeout(() => {
        infoWindow.open(map, marker)
      }, 1000)

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
