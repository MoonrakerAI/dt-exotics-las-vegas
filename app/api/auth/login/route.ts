import { NextRequest, NextResponse } from 'next/server'
import { validateCredentials, createSession } from '../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, callbackUrl } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    const user = await validateCredentials(email, password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    const sessionToken = await createSession(user)
    const redirectUrl = callbackUrl || '/admin'
    
    const response = NextResponse.json({ 
      success: true, 
      user,
      redirectUrl 
    })
    
    response.cookies.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    })
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}