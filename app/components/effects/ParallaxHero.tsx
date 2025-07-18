'use client'

import { useEffect, useState } from 'react'

interface ParallaxHeroProps {
  imageSrc: string
  alt: string
  children: React.ReactNode
}

export default function ParallaxHero({ imageSrc, alt, children }: ParallaxHeroProps) {
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.pageYOffset)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Parallax */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-dark-gray/60 z-10" />
        <img
          src={imageSrc}
          alt={alt}
          className="h-[120%] w-full object-cover"
          style={{
            transform: `translateY(${offsetY * 0.5}px)`,
            willChange: 'transform'
          }}
        />
      </div>

      {/* Content */}
      {children}
    </section>
  )
}