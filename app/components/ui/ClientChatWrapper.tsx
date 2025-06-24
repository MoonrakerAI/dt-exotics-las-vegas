'use client'

import dynamic from 'next/dynamic'

const FloatingChatNew = dynamic(() => import('./FloatingChatNew'), {
  ssr: false,
})

export default function ClientChatWrapper() {
  return <FloatingChatNew />
}