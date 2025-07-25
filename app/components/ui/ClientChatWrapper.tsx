'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const FloatingChatNew = dynamic(() => import('./FloatingChatNew'), {
  ssr: false,
})

export default function ClientChatWrapper() {
  const pathname = usePathname()
  
  // Hide AI chat on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }
  
  return <FloatingChatNew />
}