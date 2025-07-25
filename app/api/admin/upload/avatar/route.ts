import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/app/lib/auth';
import { put } from '@vercel/blob';

// Secure admin authentication using JWT
async function isAdminAuthenticated(request: NextRequest): Promise<{user: any} | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const user = await validateSession(token);
    return user && user.role === 'admin' ? {user} : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const authResult = await isAdminAuthenticated(request);
  
  if (!authResult) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { user } = authResult;
    const formData = await request.formData();
    const avatar = formData.get('avatar') as File;

    if (!avatar) {
      return NextResponse.json(
        { error: 'No avatar file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(avatar.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (avatar.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    try {
      // Upload to Vercel Blob
      const filename = `admin-avatars/${user.id}-${Date.now()}.${avatar.name.split('.').pop()}`;
      const blob = await put(filename, avatar, {
        access: 'public',
      });

      return NextResponse.json({
        success: true,
        message: 'Avatar uploaded successfully',
        urls: {
          original: blob.url
        }
      });

    } catch (blobError) {
      console.error('Blob upload error:', blobError);
      
      // Fallback to base64 if Blob storage fails
      const arrayBuffer = await avatar.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUri = `data:${avatar.type};base64,${base64}`;

      return NextResponse.json({
        success: true,
        message: 'Avatar uploaded successfully (fallback storage)',
        urls: {
          original: dataUri
        },
        fallback: true
      });
    }

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}