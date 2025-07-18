'use client'

import { usePathname } from 'next/navigation'
import AdminNavigation from './components/AdminNavigation'
import AuthGuard from '../components/auth/AuthGuard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Don't wrap login page with AuthGuard
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen bg-dark-gray">
        <main>{children}</main>
      </div>
    )
  }

  // Wrap other admin pages with AuthGuard
  return (
    <AuthGuard>
      <div className="min-h-screen bg-dark-gray">
        <AdminNavigation />
        <main>{children}</main>
      </div>
    </AuthGuard>
  )
}