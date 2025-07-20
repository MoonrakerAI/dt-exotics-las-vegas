import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import blogDB from '@/app/lib/blog-database'

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token (optional for cron jobs, but good for security)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const user = await verifyJWT(token)
      if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    }

    // Publish scheduled posts
    console.log('Starting scheduled posts publishing process...')
    await blogDB.publishScheduledPosts()
    console.log('Scheduled posts publishing process completed')

    // Get updated stats
    const stats = await blogDB.getStats()

    return NextResponse.json({ 
      success: true, 
      message: 'Scheduled posts processed',
      stats 
    })
  } catch (error) {
    console.error('Error publishing scheduled posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 