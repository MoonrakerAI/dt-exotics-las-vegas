'use client'

import { useEffect } from 'react'

export default function ScrollToTop() {
  // Only run once on initial page load
  useEffect(() => {
    // Check if this is a fresh page load (not navigation)
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual'
    }
    
    // Only scroll to top on initial mount
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, []) // Empty dependency array means this only runs once on mount

  return null
}