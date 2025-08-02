'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    google: any
    initMap?: () => void
  }
}

export default function CustomGoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

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
    lat: 36.015201,
    lng: -115.207215
  }

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMap`
      script.async = true
      script.defer = true
      
      window.initMap = initializeMap
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return

      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        center: businessLocation,
        zoom: 15,
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
        gestureHandling: 'cooperative'
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
        animation: window.google.maps.Animation.DROP
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
        ">
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 12px;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background: #00FFFF;
              border-radius: 50%;
              margin-right: 8px;
              box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
            "></div>
            <h3 style="
              margin: 0;
              font-size: 18px;
              font-weight: 700;
              color: #00FFFF;
              text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            ">DT Exotics Supercar Rentals</h3>
          </div>
          
          <p style="
            margin: 8px 0;
            font-size: 14px;
            color: #e0e0e0;
            line-height: 1.4;
          ">
            📍 9620 Las Vegas Blvd S STE E4 508<br>
            Las Vegas, NV 89123
          </p>
          
          <p style="
            margin: 12px 0 8px 0;
            font-size: 13px;
            color: #b0b0b0;
            font-style: italic;
          ">
            Luxury Exotic Car Rentals in Las Vegas
          </p>
          
          <div style="
            display: flex;
            gap: 8px;
            margin-top: 16px;
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
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 255, 255, 0.4)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 255, 255, 0.3)'">
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
            " onmouseover="this.style.background='rgba(0, 255, 255, 0.1)'"
               onmouseout="this.style.background='transparent'">
              BOOK ONLINE
            </a>
          </div>
        </div>
      `

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
        disableAutoPan: false
      })

      // Add click listener to marker
      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      // Auto-open info window after a short delay
      setTimeout(() => {
        infoWindow.open(map, marker)
      }, 1000)
    }

    loadGoogleMaps()

    return () => {
      // Cleanup
      if (window.initMap) {
        window.initMap = undefined
      }
    }
  }, [])

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-gray-600/30 relative">
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ background: '#0a0a0a' }}
      />
      
      {/* Loading overlay */}
      <div className="absolute inset-0 bg-dark-metal/80 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-500" id="map-loading">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neon-blue"></div>
          <span className="text-gray-300 text-sm">Loading custom map...</span>
        </div>
      </div>
    </div>
  )
}
