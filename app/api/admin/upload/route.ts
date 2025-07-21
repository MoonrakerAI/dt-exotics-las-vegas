import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/app/lib/auth';
import { adminApiRateLimiter, getClientIdentifier } from '@/app/lib/rate-limit';
import { put } from '@vercel/blob';

// POST: Upload files to Vercel Blob Storage
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await adminApiRateLimiter.checkLimit(clientId);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if blob storage is configured - if not, return error with helpful message
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.log('BLOB_READ_WRITE_TOKEN not found, blob storage unavailable');
      return NextResponse.json({ 
        error: 'Blob storage not configured. Using fallback storage method.',
        fallback: true
      }, { status: 503 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const carId = formData.get('carId') as string;
    const fileType = formData.get('fileType') as 'image' | 'audio';
    const uploadType = formData.get('uploadType') as string; // 'main', 'gallery', 'startup', 'rev'
    const index = formData.get('index') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!carId) {
      return NextResponse.json({ error: 'Car ID is required' }, { status: 400 });
    }

    if (!fileType || !uploadType) {
      return NextResponse.json({ error: 'File type and upload type are required' }, { status: 400 });
    }

    // Validate file size
    const maxSize = fileType === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for images, 50MB for audio
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json({ 
        error: `File too large. Maximum size: ${maxSizeMB}MB` 
      }, { status: 400 });
    }

    // Validate file type
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    const supportedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac'];
    
    const supportedTypes = fileType === 'image' ? supportedImageTypes : supportedAudioTypes;
    if (!supportedTypes.includes(file.type)) {
      const typeList = fileType === 'image' ? 'JPEG, PNG, WebP, AVIF' : 'MP3, WAV, M4A, AAC';
      return NextResponse.json({ 
        error: `Invalid file type. Supported formats: ${typeList}` 
      }, { status: 400 });
    }

    // Generate file path
    const timestamp = Date.now();
    const extension = getFileExtension(file.name);
    
    let fileName: string;
    let filePath: string;

    if (fileType === 'image') {
      fileName = uploadType === 'main' 
        ? `main-${timestamp}.${extension}`
        : `gallery-${index || 0}-${timestamp}.${extension}`;
      filePath = `cars/${carId}/images/${fileName}`;
    } else {
      fileName = `${uploadType}-${timestamp}.${extension}`;
      filePath = `cars/${carId}/audio/${fileName}`;
    }

    // Upload to Vercel Blob Storage
    const blob = await put(filePath, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Generate optimized URLs for images
    let urls: any = { original: blob.url };
    
    if (fileType === 'image') {
      // For now, use the blob URL directly to avoid optimization issues
      // In production, Vercel will handle optimization automatically
      urls = {
        original: blob.url,
        thumbnail: blob.url,
        medium: blob.url,
        optimized: blob.url,
      };
    }

    return NextResponse.json({
      success: true,
      urls,
      fileName,
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Specific error handling
    if (error instanceof Error) {
      if (error.message.includes('token')) {
        return NextResponse.json({ 
          error: 'Invalid blob storage token. Please check configuration.' 
        }, { status: 403 });
      }
      
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json({ 
          error: 'Storage quota exceeded. Please contact support.' 
        }, { status: 507 });
      }
    }

    return NextResponse.json({ 
      error: 'Internal server error during file upload' 
    }, { status: 500 });
  }
}

// DELETE: Remove files from blob storage
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await adminApiRateLimiter.checkLimit(clientId);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ 
        error: 'Blob storage not configured' 
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const carId = searchParams.get('carId');

    if (!fileUrl && !carId) {
      return NextResponse.json({ 
        error: 'Either file URL or car ID is required' 
      }, { status: 400 });
    }

    if (carId) {
      // Delete all files for a car
      const { list, del } = await import('@vercel/blob');
      
      const { blobs } = await list({
        prefix: `cars/${carId}/`,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      const deletePromises = blobs.map(blob => 
        del(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN! })
      );

      await Promise.all(deletePromises);

      return NextResponse.json({
        success: true,
        message: `Deleted ${blobs.length} files for car ${carId}`
      });
    }

    if (fileUrl) {
      // Delete specific file
      const { del } = await import('@vercel/blob');
      await del(fileUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });

      return NextResponse.json({
        success: true,
        message: 'File deleted successfully'
      });
    }

  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during file deletion' 
    }, { status: 500 });
  }
}

// Helper functions
function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || 'jpg';
}

function generateOptimizedUrl(originalUrl: string, width: number, height: number, quality: number): string {
  // Use Vercel's built-in image optimization
  const baseUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
  const protocol = baseUrl.includes('localhost') ? 'http://' : 'https://';
  const domain = baseUrl.replace(/^https?:\/\//, '');

  return `${protocol}${domain}/_next/image?url=${encodeURIComponent(originalUrl)}&w=${width}&h=${height}&q=${quality}`;
} 