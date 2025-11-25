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
            value: "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://ssl.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://www.gstatic.com https://www.clarity.ms https://*.clarity.ms https://c.clarity.ms https://connect.facebook.net https://www.facebook.com; " +
              "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://api.anthropic.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://ssl.google-analytics.com https://stats.g.doubleclick.net https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://www.clarity.ms https://*.clarity.ms https://c.clarity.ms https://connect.facebook.net https://www.facebook.com https://graph.facebook.com; " +
              "img-src 'self' data: blob: https://maps.googleapis.com https://fonts.googleapis.com https://b9c4kbeqsdvzvtpz.public.blob.vercel-storage.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://ssl.google-analytics.com https://www.google.com https://www.gstatic.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.googleadservices.com https://www.clarity.ms https://*.clarity.ms https://c.clarity.ms https://www.facebook.com https://connect.facebook.net; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; " +
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; " +
              "frame-src 'self' https://js.stripe.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://bid.g.doubleclick.net https://www.facebook.com https://connect.facebook.net; " +
              "media-src 'self' blob: data:; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self' https://js.stripe.com; " +
              "frame-ancestors 'none'" +
              (process.env.NODE_ENV === 'production' ? "; upgrade-insecure-requests" : "")
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