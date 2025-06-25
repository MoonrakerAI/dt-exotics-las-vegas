'use client'

import { Instagram, Facebook, Youtube, Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 py-12 px-4">
      <div className="max-w-[1400px] mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-12 mb-8 text-center md:text-left">
          {/* Left Section - Branding */}
          <div>
            <div className="mb-4 flex justify-center md:justify-start">
              <img 
                src="/images/logo/DT Exotics LV Logo Transparent.png" 
                alt="DT Exotics Las Vegas"
                className="h-16 mb-2"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Las Vegas's premier luxury supercar rental experience. Where automotive dreams become reality on the world's most iconic streets.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex gap-4 justify-center md:justify-start">
              <a 
                href="#" 
                className="w-10 h-10 border border-gray-600 rounded flex items-center justify-center text-neon-blue hover:border-neon-blue hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 border border-gray-600 rounded flex items-center justify-center text-neon-blue hover:border-neon-blue hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 border border-gray-600 rounded flex items-center justify-center text-neon-blue hover:border-neon-blue hover:shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Middle Section - Navigation */}
          <div>
            <h4 className="text-sm font-tech font-bold text-white uppercase tracking-wider mb-4">
              NAVIGATION
            </h4>
            <nav className="space-y-3">
              <a href="#" className="block text-gray-400 hover:text-neon-blue transition-colors duration-200">
                Home
              </a>
              <a href="#cars" className="block text-gray-400 hover:text-neon-blue transition-colors duration-200">
                Fleet
              </a>
              <a href="#contact" className="block text-gray-400 hover:text-neon-blue transition-colors duration-200">
                Contact
              </a>
              <a href="#" className="block text-gray-400 hover:text-neon-blue transition-colors duration-200">
                About
              </a>
            </nav>
          </div>

          {/* Right Section - Legal */}
          <div>
            <h4 className="text-sm font-tech font-bold text-white uppercase tracking-wider mb-4">
              LEGAL
            </h4>
            <nav className="space-y-3">
              <a href="/terms" className="block text-gray-400 hover:text-neon-blue transition-colors duration-200">
                Terms of Service
              </a>
              <a href="/privacy" className="block text-gray-400 hover:text-neon-blue transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="block text-gray-400 hover:text-neon-blue transition-colors duration-200">
                Rental Agreement
              </a>
              <a href="#" className="block text-gray-400 hover:text-neon-blue transition-colors duration-200">
                Insurance
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-gray-500 text-sm">
            © 2025 DT Exotics Las Vegas. All rights reserved. Built for speed.
          </p>
          <div className="flex items-center gap-2 text-gray-500 text-sm justify-center md:justify-end">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>
              Powered by{' '}
              <a 
                href="https://moonraker.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-neon-blue hover:text-neon-blue/80 transition-colors duration-200"
              >
                Moonraker.AI
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}