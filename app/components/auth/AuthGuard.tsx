'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleAuth, User } from '../../lib/simple-auth'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    try {
      const currentUser = SimpleAuth.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
      } else {
        // No valid auth, redirect to login
        router.push('/admin/login')
        return
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/admin/login')
      return
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-gray flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return <>{children}</>
}