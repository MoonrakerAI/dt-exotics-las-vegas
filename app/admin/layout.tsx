'use client'

import { SessionProvider } from 'next-auth/react'
import AdminNavigation from './components/AdminNavigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-dark-gray">
        <AdminNavigation />
        <main>{children}</main>
      </div>
    </SessionProvider>
  )
}