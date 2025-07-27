'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const FloatingChatNew = dynamic(() => import('./FloatingChatNew'), {
  ssr: false,
})

export default function ClientChatWrapper() {
  const pathname = usePathname()
  
  // Hide chat on admin pages and invoice pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/invoice')) {
    return null
  }
  
  return <FloatingChatNew />
}