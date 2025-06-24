'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100
      setIsScrolled(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Fleet', href: '/#cars' },
    { name: 'Bachelor Parties', href: '/bachelor-party' },
    { name: 'Birthdays', href: '/birthday' },
    { name: 'Corporate', href: '/corporate' },
    { name: 'Vegas Tours', href: '/vegas-tours' },
    { name: 'VIP Services', href: '/vip-services' },
    { name: 'Partners', href: '/partners' },
    { name: 'Contact', href: '/#contact' }
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href.startsWith('/#')) return pathname === '/' // For anchor links on homepage
    return pathname === href
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'opacity-100 translate-y-0 backdrop-blur-lg bg-black/70 border-b border-gray-800/50' 
          : 'opacity-0 -translate-y-full'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4">
          <div className={`flex items-center justify-between transition-all duration-500 ${
            isScrolled ? 'py-4' : 'py-6'
          }`}>
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="text-2xl font-tech font-black text-white hover:text-neon-blue transition-colors duration-300">
                DT <span className="text-neon-blue">EXOTICS</span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`font-tech font-medium text-sm tracking-wide transition-colors duration-300 hover:text-neon-blue ${
                    isActive(item.href) 
                      ? 'text-neon-blue' 
                      : 'text-white'
                  }`}
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center">
              <a 
                href="sms:+17027208948" 
                className="btn-primary text-sm px-6 py-3"
              >
                TEXT US NOW
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-white hover:text-neon-blue transition-colors duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
        isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={toggleMobileMenu}
        />
        
        {/* Menu Content */}
        <div className={`absolute top-0 right-0 h-full w-80 bg-dark-metal border-l border-gray-800 transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="text-xl font-tech font-black text-white">
                DT <span className="text-neon-blue">EXOTICS</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="text-white hover:text-neon-blue transition-colors duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-6">
              <div className="space-y-1 px-6">
                {navigationItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={toggleMobileMenu}
                    className={`block px-4 py-3 rounded-lg font-tech font-medium transition-colors duration-300 hover:bg-gray-800/50 hover:text-neon-blue ${
                      isActive(item.href) 
                        ? 'text-neon-blue bg-gray-800/30' 
                        : 'text-white'
                    }`}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="p-6 border-t border-gray-800">
              <a 
                href="sms:+17027208948" 
                className="btn-primary w-full text-center"
                onClick={toggleMobileMenu}
              >
                TEXT US NOW
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}