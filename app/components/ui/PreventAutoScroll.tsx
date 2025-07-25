'use client'

import { useEffect } from 'react'

export default function PreventAutoScroll() {
  useEffect(() => {
    // Only run on homepage (pathname is '/')
    if (window.location.pathname !== '/') {
      return
    }
    
    // Check if we have a valid anchor hash
    const hash = window.location.hash
    const hasValidAnchor = hash && document.querySelector(hash)
    
    // If there's a valid anchor, let the browser handle it normally
    if (hasValidAnchor) {
      return
    }
    
    // Prevent all scroll events temporarily
    const preventScroll = (e: Event) => {
      e.preventDefault()
      window.scrollTo(0, 0)
    }
    
    // Immediately scroll to top
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    // Temporarily block all scroll events
    window.addEventListener('scroll', preventScroll, { passive: false })
    document.addEventListener('scroll', preventScroll, { passive: false })
    
    // Force scroll to top multiple times to ensure it works
    const forceTop = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    
    // Run immediately and after small delays
    forceTop()
    requestAnimationFrame(forceTop)
    
    const timeouts = [10, 50, 100, 200, 300, 500]
    timeouts.forEach(delay => {
      setTimeout(forceTop, delay)
    })
    
    // Remove scroll prevention after a delay
    setTimeout(() => {
      window.removeEventListener('scroll', preventScroll)
      document.removeEventListener('scroll', preventScroll)
    }, 600)
    
    return () => {
      window.removeEventListener('scroll', preventScroll)
      document.removeEventListener('scroll', preventScroll)
    }
  }, [])

  return null
}