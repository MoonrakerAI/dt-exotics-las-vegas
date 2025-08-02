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

  // Business location coordinates (DT Exotics - 9620 Las Vegas Blvd S, Las Vegas, NV 89123)
  const businessLocation = {
    lat: 36.015278,
    lng: -115.207222
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

      // Create custom positioned overlay in top-left corner (detached from marker)
      const customInfoOverlay = document.createElement('div')
      customInfoOverlay.innerHTML = `
        <div style="
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 1000;
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid #00FFFF;
          border-radius: 12px;
          padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: white;
          box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3), 0 4px 20px rgba(0, 0, 0, 0.8);
          min-width: 280px;
          max-width: 320px;
          backdrop-filter: blur(10px);
        ">
          <!-- Business Header -->
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
              overflow: hidden;
            ">
              <img src="/images/logo/DT Exotics Logo Icon Black.png" alt="DT Exotics" style="
                width: 24px;
                height: 24px;
                object-fit: contain;
              " />
            </div>
            <div>
              <h3 style="
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                color: #00FFFF;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                letter-spacing: 0.5px;
              ">DT Exotics</h3>
              <p style="
                margin: 0;
                font-size: 12px;
                color: #b0b0b0;
                font-weight: 500;
              ">Supercar Rentals</p>
            </div>
          </div>
          
          <!-- Reviews -->
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          ">
            <span style="color: #ffa500; margin-right: 6px; font-size: 14px;">★★★★★</span>
            <span style="color: #ccc; font-size: 13px; font-weight: 500;">5.0 (Google Reviews)</span>
          </div>
          
          <!-- Address -->
          <div style="
            margin-bottom: 16px;
            padding: 12px;
            background: rgba(0, 255, 255, 0.05);
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 255, 0.2);
          ">
            <div style="
              display: flex;
              align-items: center;
              color: #e0e0e0;
              font-size: 13px;
              font-weight: 500;
            ">
              <span style="margin-right: 8px; color: #00FFFF;">📍</span>
              <span>9620 Las Vegas Blvd S, Las Vegas, NV 89123</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
          ">
            <a href="https://www.google.com/maps/dir//9620+Las+Vegas+Blvd+S,+Las+Vegas,+NV+89123" target="_blank" style="
              background: linear-gradient(135deg, #333 0%, #444 100%);
              color: white;
              padding: 10px 16px;
              border-radius: 8px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 600;
              flex: 1;
              text-align: center;
              border: 1px solid #555;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            " onmouseover="this.style.background='linear-gradient(135deg, #444 0%, #555 100%)'; this.style.transform='translateY(-1px)'"
               onmouseout="this.style.background='linear-gradient(135deg, #333 0%, #444 100%)'; this.style.transform='translateY(0)'">
              Directions
            </a>
            <a href="sms:+17025180924" style="
              background: linear-gradient(135deg, #00FFFF 0%, #00CCCC 100%);
              color: #000;
              padding: 10px 16px;
              border-radius: 8px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 600;
              flex: 1;
              text-align: center;
              transition: all 0.3s ease;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
            " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(0, 255, 255, 0.4)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 255, 255, 0.3)'">
              Text Us
            </a>
          </div>
          
          <!-- Additional Info -->
          <div style="
            padding-top: 12px;
            border-top: 1px solid rgba(0, 255, 255, 0.2);
            font-size: 12px;
            color: #ccc;
          ">
            <div style="margin-bottom: 6px; display: flex; align-items: center;">
              <span style="color: #00FFFF; margin-right: 8px;">📞</span>
              <span style="font-weight: 500;">(702) 518-0924</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="color: #00FFFF; margin-right: 8px;">🌐</span>
              <a href="/book-rental" style="
                color: #00FFFF;
                text-decoration: none;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                transition: all 0.3s ease;
              " onmouseover="this.style.color='#00DDDD'; this.style.textShadow='0 0 8px rgba(0, 255, 255, 0.6)'"
                 onmouseout="this.style.color='#00FFFF'; this.style.textShadow='none'">Book Online</a>
            </div>
          </div>
        </div>
      `
      
      // Add the custom overlay to the map container
      if (mapRef.current) {
        mapRef.current.appendChild(customInfoOverlay)
      }

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
