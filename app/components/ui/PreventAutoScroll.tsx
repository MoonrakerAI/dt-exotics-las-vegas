'use client'

import { useEffect } from 'react'

export default function PreventAutoScroll() {
  useEffect(() => {
    // Prevent auto-scroll on page load
    if (typeof window !== 'undefined') {
      // Store the current scroll position
      const scrollY = window.scrollY || document.documentElement.scrollTop
      
      // If we're not at the top, force scroll to top
      if (scrollY > 0) {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }
      
      // Remove any hash from URL without triggering scroll
      if (window.location.hash) {
        const url = window.location.href.split('#')[0]
        window.history.replaceState({}, document.title, url)
      }
    }
  }, [])

  return null
}