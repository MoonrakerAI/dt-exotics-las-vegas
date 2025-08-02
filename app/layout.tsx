import type { Metadata } from 'next'
import './globals.css'
import ClientChatWrapper from './components/ui/ClientChatWrapper'
import FontLoader from './components/ui/FontLoader'

export const metadata: Metadata = {
  title: 'DT Exotics Las Vegas - Premium Supercar Rentals',
  description: 'Experience the thrill of driving the world\'s most exclusive supercars in Las Vegas. Lamborghini, Ferrari, McLaren, and more available for rent.',
  keywords: 'supercar rental, Las Vegas, exotic car rental, Lamborghini rental, Ferrari rental, luxury car rental',
  icons: {
    icon: '/images/logo/DT Exotics Logo Icon.png',
    apple: '/images/logo/DT Exotics Logo Icon.png',
  },
  openGraph: {
    title: 'DT Exotics Las Vegas - Premium Supercar Rentals',
    description: 'Experience the thrill of driving the world\'s most exclusive supercars in Las Vegas.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" />
        <link rel="preconnect" href="https://b9c4kbeqsdvzvtpz.public.blob.vercel-storage.com" />
        
        {/* Preload critical font files to reduce critical path latency */}
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/orbitron/v34/yMJRMIlzdpvBhQQL_Qq7dys.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.gstatic.com/s/inter/v19/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        

      </head>
      <body className="min-h-screen antialiased">
        <FontLoader />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-metal-gray/20 via-dark-gray to-dark-gray pointer-events-none" />
        {children}
        <ClientChatWrapper />
      </body>
    </html>
  )
}