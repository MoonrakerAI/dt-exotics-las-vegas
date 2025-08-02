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
        zoom: 15,
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

      // Custom marker icon (neon blue)
      const customMarker = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#00FFFF',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        strokeOpacity: 1
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

      // Custom info window content with brand styling
      const infoWindowContent = `
        <div style="
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid #00FFFF;
          border-radius: 12px;
          padding: 20px;
          font-family: 'Inter', sans-serif;
          color: white;
          box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3);
          min-width: 280px;
          max-width: 320px;
        ">
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          ">
            <div style="
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #00FFFF 0%, #00CCCC 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              box-shadow: 0 4px 15px rgba(0, 255, 255, 0.4);
            ">
              <span style="
                color: #000;
                font-weight: bold;
                font-size: 18px;
              ">🏎️</span>
            </div>
            <div>
              <h3 style="
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                color: #00FFFF;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
              ">DT Exotics</h3>
              <p style="
                margin: 0;
                font-size: 12px;
                color: #b0b0b0;
              ">Las Vegas, NV</p>
            </div>
          </div>
          
          <p style="
            margin: 0 0 16px 0;
            font-size: 13px;
            line-height: 1.4;
            color: #b0b0b0;
            font-style: italic;
          ">
            Luxury Exotic Car Rentals in Las Vegas
          </p>
          
          <div style="
            display: flex;
            gap: 8px;
            margin-top: 16px;
            flex-wrap: wrap;
          ">
            <a href="sms:+17025180924" style="
              background: linear-gradient(135deg, #00FFFF 0%, #00CCCC 100%);
              color: #000;
              padding: 8px 16px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
              flex: 1;
              text-align: center;
            ">
              TEXT US NOW
            </a>
            <a href="/book-rental" style="
              background: transparent;
              color: #00FFFF;
              border: 1px solid #00FFFF;
              padding: 8px 16px;
              border-radius: 6px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.3s ease;
              flex: 1;
              text-align: center;
            ">
              BOOK ONLINE
            </a>
          </div>
        </div>
      `

      // Create info window with proper configuration
      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
        disableAutoPan: false,
        maxWidth: 350,
        pixelOffset: new window.google.maps.Size(0, -10)
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
