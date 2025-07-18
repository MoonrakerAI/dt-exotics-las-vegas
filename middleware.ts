import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // Protect admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!req.auth?.user) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Check if user has admin role
    if ((req.auth.user as any).role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*']
}