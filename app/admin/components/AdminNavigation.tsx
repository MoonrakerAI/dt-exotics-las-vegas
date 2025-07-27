'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Car, 
  FileText, 
  Settings, 
  LogOut, 
  User,
  Calendar,
  CreditCard
} from 'lucide-react'
import { SimpleAuth } from '../../lib/simple-auth'

const navItems = [
  { 
    href: '/admin', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Rental bookings and payments'
  },
  { 
    href: '/admin/bookings', 
    label: 'Bookings', 
    icon: Calendar,
    description: 'Manage reservations and rentals'
  },
  { 
    href: '/admin/invoices', 
    label: 'Invoices', 
    icon: CreditCard,
    description: 'Create custom invoices'
  },
  { 
    href: '/admin/blog', 
    label: 'Blog', 
    icon: FileText,
    description: 'Manage blog posts and SEO'
  },
  { 
    href: '/admin/fleet', 
    label: 'Fleet', 
    icon: Car,
    description: 'Vehicle management'
  },
  { 
    href: '/admin/settings', 
    label: 'Settings', 
    icon: Settings,
    description: 'System configuration'
  }
]

export default function AdminNavigation() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    
    // Listen for profile updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dt-admin-user') {
        checkAuth()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom profile update events
    const handleProfileUpdate = () => {
      checkAuth()
    }
    
    window.addEventListener('profileUpdated', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [])

  const checkAuth = () => {
    try {
      const user = SimpleAuth.getCurrentUser()
      if (user) {
        setUser(user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  if (!user || pathname === '/admin/login') {
    return null
  }

  const handleSignOut = () => {
    try {
      SimpleAuth.logout()
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="bg-dark-metal/80 backdrop-blur-sm border-b border-gray-600/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/images/logo/DT Exotics Logo Icon.png"
                  alt="DT Exotics"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-tech font-bold text-white">
                  ADMIN PANEL
                </h1>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-neon-blue text-black'
                      : 'text-gray-300 hover:text-white hover:bg-dark-gray/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/profile"
              className="flex items-center space-x-3 hover:bg-dark-gray/50 rounded-lg px-3 py-2 transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center group-hover:bg-gray-500 overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <User className={`w-4 h-4 text-white ${user.avatar ? 'hidden' : ''}`} />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white group-hover:text-neon-blue">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400">
                  {user.email}
                </p>
              </div>
            </Link>
            
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-dark-gray/50 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-neon-blue text-black'
                      : 'text-gray-300 hover:text-white hover:bg-dark-gray/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}