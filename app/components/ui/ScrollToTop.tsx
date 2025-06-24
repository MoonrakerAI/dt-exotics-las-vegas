'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToTop() {
  const pathname = usePathname()
  
  useEffect(() => {
    // Force scroll to top immediately on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    
    // Additional timeout to ensure it works on all browsers
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }, 50)
    
    return () => clearTimeout(timer)
  }, [pathname])

  // Also handle on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  return null
}