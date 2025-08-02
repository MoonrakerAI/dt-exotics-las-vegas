'use client'

import Image from 'next/image'

interface OptimizedLogoProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
  alt?: string
  priority?: boolean
}

const logoSizes = {
  small: { width: 24, height: 24 },
  medium: { width: 48, height: 48 },
  large: { width: 96, height: 96 }
}

export default function OptimizedLogo({ 
  size = 'medium', 
  className = '', 
  alt = 'DT Exotics Logo',
  priority = false 
}: OptimizedLogoProps) {
  const { width, height } = logoSizes[size]
  
  return (
    <Image
      src="/images/logo/DT Exotics Logo Icon Black.png"
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={`${width}px`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        objectFit: 'contain'
      }}
    />
  )
}
