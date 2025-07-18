import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

// Demo admin user - in production, use a proper database
const ADMIN_USER: User = {
  id: "1",
  email: "chris@moonraker.ai",
  name: "Chris Morin",
  role: "admin"
}

const ADMIN_PASSWORD = "AI2025!"

export async function validateCredentials(email: string, password: string): Promise<User | null> {
  if (email === ADMIN_USER.email && password === ADMIN_PASSWORD) {
    return ADMIN_USER
  }
  return null
}

export async function createSession(user: User): Promise<string> {
  // In production, use proper JWT signing with a secret
  const sessionData = {
    user,
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  }
  return Buffer.from(JSON.stringify(sessionData)).toString('base64')
}

export async function validateSession(sessionToken: string): Promise<User | null> {
  try {
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
    
    if (sessionData.expires < Date.now()) {
      return null // Session expired
    }
    
    return sessionData.user
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('admin-session')?.value
    
    if (!sessionToken) {
      return null
    }
    
    return await validateSession(sessionToken)
  } catch {
    return null
  }
}

export function createAuthResponse(user: User, redirectTo: string = '/admin'): NextResponse {
  const response = NextResponse.redirect(new URL(redirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  
  createSession(user).then(sessionToken => {
    response.cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })
  })
  
  return response
}

export function createLogoutResponse(redirectTo: string = '/admin/login'): NextResponse {
  const response = NextResponse.redirect(new URL(redirectTo, process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  response.cookies.delete('admin-session')
  return response
}