import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import blogDB from '@/app/lib/blog-database'

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Update category post counts
    await blogDB.updateCategoryCounts()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating category counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 