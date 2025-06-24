import type { Metadata } from 'next'
import './globals.css'
import ClientChatWrapper from './components/ui/ClientChatWrapper'

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Force scroll to top before page loads
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              if (window.history) {
                window.history.scrollRestoration = 'manual';
              }
              // Remove hash from URL
              if (window.location.hash) {
                window.history.replaceState(null, '', window.location.pathname);
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-metal-gray/20 via-dark-gray to-dark-gray pointer-events-none" />
        {children}
        <ClientChatWrapper />
      </body>
    </html>
  )
}