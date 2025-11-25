/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable image optimization for better performance
  images: {
    domains: ['localhost', 'b9c4kbeqsdvzvtpz.public.blob.vercel-storage.com', 'maps.googleapis.com', 'fonts.googleapis.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache for images
  },
  
  // Enable compression for better performance
  compress: true,
  
  // Target modern browsers to reduce legacy JavaScript and polyfills
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Optimize for modern browsers - reduce polyfills and transforms
  experimental: {
    esmExternals: true,
    swcPlugins: [],
  },
  
  // Override default transpilation to target modern browsers
  transpilePackages: [],
  
  // Configure headers for security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              // Default policy
              "default-src 'self'",
              
              // Scripts: Allow inline scripts, eval (for GTM), and all tracking platforms
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
                "https://js.stripe.com " +
                "https://maps.googleapis.com " +
                "https://www.googletagmanager.com " +
                "https://*.googletagmanager.com " +
                "https://www.google-analytics.com " +
                "https://*.google-analytics.com " +
                "https://ssl.google-analytics.com " +
                "https://www.googleadservices.com " +
                "https://googleads.g.doubleclick.net " +
                "https://*.doubleclick.net " +
                "https://www.google.com " +
                "https://www.gstatic.com " +
                "https://www.clarity.ms " +
                "https://*.clarity.ms " +
                "https://c.clarity.ms " +
                "https://connect.facebook.net " +
                "https://www.facebook.com",
              
              // Connect: Allow API calls and data sending for all platforms
              "connect-src 'self' " +
                "https://api.stripe.com " +
                "https://maps.googleapis.com " +
                "https://api.anthropic.com " +
                "https://www.googletagmanager.com " +
                "https://*.googletagmanager.com " +
                "https://www.google-analytics.com " +
                "https://*.google-analytics.com " +
                "https://ssl.google-analytics.com " +
                "https://stats.g.doubleclick.net " +
                "https://www.googleadservices.com " +
                "https://googleads.g.doubleclick.net " +
                "https://*.doubleclick.net " +
                "https://www.google.com " +
                "https://www.clarity.ms " +
                "https://*.clarity.ms " +
                "https://c.clarity.ms " +
                "https://connect.facebook.net " +
                "https://www.facebook.com " +
                "https://graph.facebook.com",
              
              // Images: Allow tracking pixels and images from all platforms
              "img-src 'self' data: blob: " +
                "https://maps.googleapis.com " +
                "https://fonts.googleapis.com " +
                "https://b9c4kbeqsdvzvtpz.public.blob.vercel-storage.com " +
                "https://www.googletagmanager.com " +
                "https://*.googletagmanager.com " +
                "https://www.google-analytics.com " +
                "https://*.google-analytics.com " +
                "https://ssl.google-analytics.com " +
                "https://www.google.com " +
                "https://www.gstatic.com " +
                "https://googleads.g.doubleclick.net " +
                "https://*.doubleclick.net " +
                "https://www.googleadservices.com " +
                "https://www.clarity.ms " +
                "https://*.clarity.ms " +
                "https://c.clarity.ms " +
                "https://www.facebook.com " +
                "https://connect.facebook.net",
              
              // Styles: Allow inline styles and external stylesheets
              "style-src 'self' 'unsafe-inline' " +
                "https://fonts.googleapis.com " +
                "https://www.gstatic.com",
              
              // Fonts: Allow Google Fonts and other font sources
              "font-src 'self' data: " +
                "https://fonts.gstatic.com " +
                "https://fonts.googleapis.com",
              
              // Frames: Allow iframes for GTM noscript, Google Ads, and other embeds
              "frame-src 'self' " +
                "https://js.stripe.com " +
                "https://www.googletagmanager.com " +
                "https://*.googletagmanager.com " +
                "https://www.google.com " +
                "https://googleads.g.doubleclick.net " +
                "https://*.doubleclick.net " +
                "https://bid.g.doubleclick.net " +
                "https://www.facebook.com " +
                "https://connect.facebook.net",
              
              // Media: Allow video and audio from self
              "media-src 'self' blob: data:",
              
              // Objects: Disallow plugins
              "object-src 'none'",
              
              // Base URI: Restrict base tag
              "base-uri 'self'",
              
              // Form actions: Allow form submissions to self and Stripe
              "form-action 'self' https://js.stripe.com",
              
              // Frame ancestors: Prevent clickjacking
              "frame-ancestors 'none'",
              
              // Upgrade insecure requests in production
              process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : ""
            ].filter(Boolean).join('; ')
          }
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      }
    ]
  },
}

module.exports = nextConfig