import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { kv } from '@vercel/kv'

export interface User {
  id: string
  email: string
  name: string
  role: string
}

// Get admin credentials from environment variables
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_SECRET')
}

// Multiple admin users configuration
const ADMIN_USERS: User[] = [
  {
    id: "1",
    email: process.env.ADMIN_EMAIL_1 || "admin@dtexoticslv.com",
    name: "Primary Admin",
    role: "admin"
  },
  {
    id: "2", 
    email: process.env.ADMIN_EMAIL_2 || "manager@dtexoticslv.com",
    name: "Manager",
    role: "admin"
  },
  {
    id: "3",
    email: process.env.ADMIN_EMAIL_3 || "support@dtexoticslv.com", 
    name: "Support Admin",
    role: "admin"
  }
]

// Admin password hashes (corresponding to ADMIN_EMAIL_1, ADMIN_EMAIL_2, ADMIN_EMAIL_3)
const ADMIN_PASSWORD_HASHES = [
  process.env.ADMIN_PASSWORD_HASH_1,
  process.env.ADMIN_PASSWORD_HASH_2, 
  process.env.ADMIN_PASSWORD_HASH_3
]

export async function validateCredentials(email: string, password: string): Promise<User | null> {
  // Find the admin user by email
  const adminUser = ADMIN_USERS.find(user => user.email.toLowerCase() === email.toLowerCase())
  
  if (!adminUser) {
    return null
  }

  // Get the corresponding password hash
  const userIndex = ADMIN_USERS.findIndex(user => user.email.toLowerCase() === email.toLowerCase())
  const passwordHash = ADMIN_PASSWORD_HASHES[userIndex]
  
  if (!passwordHash) {
    return null
  }

  // Hash the provided password and compare
  const crypto = await import('crypto')
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
  
  if (hashedPassword === passwordHash) {
    return adminUser
  }
  
  return null
}

export async function createSession(user: User): Promise<string> {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }
  
  return jwt.sign(payload, JWT_SECRET!, { algorithm: 'HS256' })
}

export async function validateSession(sessionToken: string): Promise<User | null> {
  try {
    const payload = jwt.verify(sessionToken, JWT_SECRET!, { algorithms: ['HS256'] }) as any
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null // Token expired
    }
    
    // Find the user in our admin list
    const user = ADMIN_USERS.find(u => u.id === payload.userId)
    
    if (!user) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  } catch (error) {
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

// Helper function to get all admin users (for display purposes)
export function getAllAdminUsers(): User[] {
  return ADMIN_USERS.filter(user => {
    const userIndex = ADMIN_USERS.findIndex(u => u.id === user.id)
    return ADMIN_PASSWORD_HASHES[userIndex] // Only return users with configured passwords
  })
}

// Get user with enriched profile data from KV storage
export async function getEnrichedUser(userId: string): Promise<User & { avatar?: string; bio?: string } | null> {
  try {
    // Get base user data
    const baseUser = ADMIN_USERS.find(user => user.id === userId)
    if (!baseUser) {
      return null
    }

    // Get enriched profile data from KV
    const profileData = await kv.get(`admin:profile:${userId}`)
    
    // Merge base user with profile data
    return {
      ...baseUser,
      ...(profileData as object || {})
    }
  } catch (error) {
    console.error('Error getting enriched user:', error)
    // Return base user data as fallback
    const baseUser = ADMIN_USERS.find(user => user.id === userId)
    return baseUser || null
  }
}

// JWT verification function for API routes
export async function verifyJWT(token: string): Promise<User | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET!, { algorithms: ['HS256'] }) as any
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null // Token expired
    }
    
    // Find the user in our admin list
    const user = ADMIN_USERS.find(u => u.id === payload.userId)
    
    if (!user) {
      return null
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  } catch (error) {
    return null
  }
}