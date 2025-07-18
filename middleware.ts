import { NextRequest, NextResponse } from "next/server"
import { validateSession } from "./app/lib/auth"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip API routes - let them handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Protect admin routes (but exclude login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionToken = req.cookies.get('admin-session')?.value
    
    if (!sessionToken) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    try {
      const user = await validateSession(sessionToken)
      if (!user || user.role !== 'admin') {
        const loginUrl = new URL('/admin/login', req.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}