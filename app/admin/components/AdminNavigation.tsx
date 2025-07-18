'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
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

const navItems = [
  { 
    href: '/admin', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Rental bookings and payments'
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
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (status === 'loading') {
    return null
  }

  if (!session?.user || pathname === '/admin/login') {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <nav className="bg-dark-metal/80 backdrop-blur-sm border-b border-gray-600/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-neon-blue rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-black font-bold" />
              </div>
              <div>
                <h1 className="text-lg font-tech font-bold text-white">
                  DT EXOTICS
                </h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
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
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-400">
                  {session.user.email}
                </p>
              </div>
            </div>
            
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