'use client'

import { useEffect, useState } from 'react'

interface LazyResourceLoaderProps {
  children: React.ReactNode
}

/**
 * Lazy loads external resource preconnects only after user interaction
 * to prevent resource leakage and fingerprinting before consent
 */
export default function LazyResourceLoader({ children }: LazyResourceLoaderProps) {
  const [resourcesLoaded, setResourcesLoaded] = useState(false)

  useEffect(() => {
    // Load resources on first user interaction
    const loadResources = () => {
      if (resourcesLoaded) return

      // Add preconnect hints dynamically
      const resources = [
        { href: 'https://fonts.googleapis.com', crossOrigin: false },
        { href: 'https://fonts.gstatic.com', crossOrigin: true },
        { href: 'https://maps.googleapis.com', crossOrigin: false },
        { href: 'https://maps.gstatic.com', crossOrigin: false },
        { href: 'https://images.unsplash.com', crossOrigin: false },
        { href: 'https://b9c4kbeqsdvzvtpz.public.blob.vercel-storage.com', crossOrigin: true },
      ]

      resources.forEach(({ href, crossOrigin }) => {
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = href
        if (crossOrigin) {
          link.crossOrigin = 'anonymous'
        }
        document.head.appendChild(link)
      })

      // Add DNS prefetch hints
      const dnsPrefetch = [
        'https://www.youtube.com',
        'https://i.ytimg.com',
      ]

      dnsPrefetch.forEach((href) => {
        const link = document.createElement('link')
        link.rel = 'dns-prefetch'
        link.href = href
        document.head.appendChild(link)
      })

      setResourcesLoaded(true)
      
      // Remove listeners after loading
      document.removeEventListener('mousedown', loadResources)
      document.removeEventListener('touchstart', loadResources)
      document.removeEventListener('keydown', loadResources)
      document.removeEventListener('scroll', loadResources)
    }

    // Trigger on any user interaction
    document.addEventListener('mousedown', loadResources, { once: true, passive: true })
    document.addEventListener('touchstart', loadResources, { once: true, passive: true })
    document.addEventListener('keydown', loadResources, { once: true, passive: true })
    document.addEventListener('scroll', loadResources, { once: true, passive: true })

    return () => {
      document.removeEventListener('mousedown', loadResources)
      document.removeEventListener('touchstart', loadResources)
      document.removeEventListener('keydown', loadResources)
      document.removeEventListener('scroll', loadResources)
    }
  }, [resourcesLoaded])

  return <>{children}</>
}
