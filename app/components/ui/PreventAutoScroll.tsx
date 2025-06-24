'use client'

import { useEffect } from 'react'

export default function PreventAutoScroll() {
  useEffect(() => {
    // Only run on homepage (pathname is '/')
    if (window.location.pathname !== '/') {
      return
    }
    
    // Immediately scroll to top
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
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
    
    const timeouts = [10, 50, 100]
    timeouts.forEach(delay => {
      setTimeout(forceTop, delay)
    })
  }, [])

  return null
}