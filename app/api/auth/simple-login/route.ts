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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Simple credential check
    if (email === ADMIN_USER.email && password === ADMIN_PASSWORD) {
      // Create a simple token (timestamp + user id)
      const token = Buffer.from(`${Date.now()}-${ADMIN_USER.id}-dt-exotics`).toString('base64')
      
      return NextResponse.json({ 
        success: true, 
        user: ADMIN_USER,
        token: token
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}