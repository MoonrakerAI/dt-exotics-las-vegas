'use client'

import { useEffect } from 'react'

export default function PreventAutoScroll() {
  useEffect(() => {
    // Add loaded class after preventing scroll
    document.documentElement.classList.add('loaded')
    
    // Immediately scroll to top
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    // Disable scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    
    // Remove any hash from URL without triggering scroll
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    
    // Force scroll to top multiple times to ensure it works
    const forceTop = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    
    // Run immediately and after small delays
    forceTop()
    requestAnimationFrame(forceTop)
    
    const timeouts = [0, 10, 50, 100, 200]
    timeouts.forEach(delay => {
      setTimeout(forceTop, delay)
    })
    
    // Also prevent any scroll on page show (back/forward navigation)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        forceTop()
      }
    }
    
    window.addEventListener('pageshow', handlePageShow)
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      document.documentElement.classList.add('loaded')
    }
  }, [])

  return null
}