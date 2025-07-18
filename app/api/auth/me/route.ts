import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Try cookie first
    let sessionToken = request.cookies.get('admin-session')?.value
    
    // Fallback to Authorization header
    if (!sessionToken) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7)
      }
    }
    
    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
    const user = await validateSession(sessionToken)
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}