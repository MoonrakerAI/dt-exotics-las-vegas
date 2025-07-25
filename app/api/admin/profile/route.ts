import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/app/lib/auth'
import { kv } from '@vercel/kv'
import { AdminProfile } from '@/app/types/admin'

const PROFILE_PREFIX = 'admin_profile:'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create profile
    let profile = await kv.get<AdminProfile>(`${PROFILE_PREFIX}${user.id}`)
    
    if (!profile) {
      // Create default profile
      profile = {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.name,
        role: user.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await kv.set(`${PROFILE_PREFIX}${user.id}`, profile)
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = await verifyJWT(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { displayName, bio, avatar } = body

    // Get existing profile
    let profile = await kv.get<AdminProfile>(`${PROFILE_PREFIX}${user.id}`)
    
    if (!profile) {
      // Create new profile if it doesn't exist
      profile = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    // Update profile
    const updatedProfile: AdminProfile = {
      ...profile,
      displayName: displayName || profile.displayName,
      bio: bio !== undefined ? bio : profile.bio,
      avatar: avatar !== undefined ? avatar : profile.avatar,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`${PROFILE_PREFIX}${user.id}`, updatedProfile)

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}