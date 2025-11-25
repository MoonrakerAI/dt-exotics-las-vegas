import { NextRequest, NextResponse } from "next/server"

export async function middleware(req: NextRequest) {
  const response = NextResponse.next()
  
  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://ssl.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://www.gstatic.com https://www.clarity.ms https://*.clarity.ms https://c.clarity.ms https://connect.facebook.net https://www.facebook.com https://*.googleoptimize.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com;
    font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com;
    img-src 'self' data: blob: https://maps.googleapis.com https://fonts.googleapis.com https://b9c4kbeqsdvzvtpz.public.blob.vercel-storage.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://ssl.google-analytics.com https://www.google.com https://www.gstatic.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.googleadservices.com https://www.clarity.ms https://*.clarity.ms https://c.clarity.ms https://www.facebook.com https://connect.facebook.net;
    media-src 'self' blob: data: https://b9c4kbeqsdvzvtpz.public.blob.vercel-storage.com;
    connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://api.anthropic.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://ssl.google-analytics.com https://stats.g.doubleclick.net https://www.googleadservices.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://www.clarity.ms https://*.clarity.ms https://c.clarity.ms https://connect.facebook.net https://www.facebook.com https://graph.facebook.com;
    frame-src 'self' https://js.stripe.com https://www.youtube.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://bid.g.doubleclick.net https://www.facebook.com https://connect.facebook.net;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://js.stripe.com;
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm)$).*)',
  ],
}