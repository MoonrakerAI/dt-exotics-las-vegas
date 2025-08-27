import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import blogDB from '@/app/lib/blog-database'

function isKvConfigured() {
  return !!(process.env.VERCEL_KV_REST_API_URL && process.env.VERCEL_KV_REST_API_TOKEN)
}

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

    // Ensure KV configured
    if (!isKvConfigured()) {
      return NextResponse.json({ error: 'KV is not configured. Blog storage unavailable.' }, { status: 503 })
    }

    // Update tag post counts
    await blogDB.updateTagCounts()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating tag counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 