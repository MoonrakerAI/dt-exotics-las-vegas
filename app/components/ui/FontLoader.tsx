'use client'

import { useEffect } from 'react'

export default function FontLoader() {
  useEffect(() => {
    // Create non-blocking font loading
    const fontLink = document.createElement('link')
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap'
    fontLink.rel = 'stylesheet'
    fontLink.media = 'print'
    
    fontLink.onload = () => {
      fontLink.media = 'all'
    }
    
    // Fallback for browsers that don't support onload
    setTimeout(() => {
      fontLink.media = 'all'
    }, 100)
    
    document.head.appendChild(fontLink)
    
    return () => {
      // Cleanup on unmount
      if (document.head.contains(fontLink)) {
        document.head.removeChild(fontLink)
      }
    }
  }, [])

  return null
}
