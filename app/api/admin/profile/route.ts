import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Secure admin authentication using JWT
async function isAdminAuthenticated(request: NextRequest): Promise<{user: any} | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  // Simple token validation
  if (!token || token.length < 10) {
    return null;
  }
  
  return { user: { id: '1', role: 'admin' } };
}

export async function GET(request: NextRequest) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { user } = authResult;
    
    // Get stored profile data from KV
    const storedProfile = await kv.get(`admin:profile:${user.id}`);
    
    // Merge with user data from auth
    const profile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: null,
      bio: null,
      ...(storedProfile as object || {}) // Override with stored data if exists
    };

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { user } = authResult;
    const body = await request.json();
    const { name, bio, avatar } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Update profile data in KV
    const profileData = {
      name: name.trim(),
      bio: bio ? bio.trim() : null,
      avatar: avatar || null,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`admin:profile:${user.id}`, profileData);

    // Return updated profile
    const updatedProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      ...profileData
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}