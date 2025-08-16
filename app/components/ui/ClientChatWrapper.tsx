'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const FloatingChatNew = dynamic(() => import('./FloatingChatNew'), {
  ssr: false,
})

export default function ClientChatWrapper() {
  const pathname = usePathname()
  
  // Hide chat on admin pages, invoice pages, and rental agreement pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/invoice') || pathname.startsWith('/rental-agreement')) {
    return null
  }
  
  return <FloatingChatNew />
}