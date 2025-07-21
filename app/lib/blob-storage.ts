// Production-ready blob storage service using Vercel Blob
import { put, del, list } from '@vercel/blob';

export interface BlobUploadResult {
  success: boolean;
  urls?: {
    original: string;
    thumbnail?: string;
    medium?: string;
    optimized?: string;
  };
  error?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ImageVariant {
  size: 'thumbnail' | 'medium' | 'optimized' | 'original';
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}

export class BlobStorageService {
  private readonly BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
  
  // Image variants for different use cases
  private readonly IMAGE_VARIANTS: ImageVariant[] = [
    { size: 'thumbnail', width: 300, height: 200, quality: 80, format: 'webp' },
    { size: 'medium', width: 800, height: 600, quality: 85, format: 'webp' },
    { size: 'optimized', width: 1200, height: 900, quality: 90, format: 'webp' },
    { size: 'original' } // Keep original for high-quality viewing
  ];

  // Upload image with multiple variants
  async uploadImage(
    file: File, 
    carId: string, 
    type: 'main' | 'gallery',
    index?: number
  ): Promise<BlobUploadResult> {
    try {
      if (!this.BLOB_READ_WRITE_TOKEN) {
        console.warn('BLOB_READ_WRITE_TOKEN not configured, falling back to base64');
        return this.uploadImageFallback(file, carId, type, index);
      }

      // Generate file paths
      const timestamp = Date.now();
      const extension = this.getFileExtension(file.name);
      const baseFileName = type === 'main' 
        ? `main-${timestamp}`
        : `gallery-${index || 0}-${timestamp}`;
      
      const basePath = `cars/${carId}/images/${baseFileName}`;

      // Upload original file
      const originalBlob = await put(`${basePath}.${extension}`, file, {
        access: 'public',
        token: this.BLOB_READ_WRITE_TOKEN,
      });

      const urls = {
        original: originalBlob.url,
        thumbnail: this.generateOptimizedUrl(originalBlob.url, 'thumbnail'),
        medium: this.generateOptimizedUrl(originalBlob.url, 'medium'),
        optimized: this.generateOptimizedUrl(originalBlob.url, 'optimized'),
      };

      return {
        success: true,
        urls,
        fileName: baseFileName,
        fileSize: file.size
      };

    } catch (error) {
      console.error('Blob image upload error:', error);
      
      // Fallback to base64 if blob storage fails
      return this.uploadImageFallback(file, carId, type, index);
    }
  }

  // Upload audio file
  async uploadAudio(
    file: File, 
    carId: string, 
    type: 'startup' | 'rev'
  ): Promise<BlobUploadResult> {
    try {
      if (!this.BLOB_READ_WRITE_TOKEN) {
        console.warn('BLOB_READ_WRITE_TOKEN not configured, falling back to base64');
        return this.uploadAudioFallback(file, carId, type);
      }

      const timestamp = Date.now();
      const extension = this.getFileExtension(file.name);
      const fileName = `${type}-${timestamp}.${extension}`;
      const filePath = `cars/${carId}/audio/${fileName}`;

      const blob = await put(filePath, file, {
        access: 'public',
        token: this.BLOB_READ_WRITE_TOKEN,
      });

      return {
        success: true,
        urls: { original: blob.url },
        fileName,
        fileSize: file.size
      };

    } catch (error) {
      console.error('Blob audio upload error:', error);
      return this.uploadAudioFallback(file, carId, type);
    }
  }

  // Delete files from blob storage
  async deleteCarFiles(carId: string): Promise<void> {
    try {
      if (!this.BLOB_READ_WRITE_TOKEN) {
        return; // Can't delete if no token
      }

      // List all files for this car
      const { blobs } = await list({
        prefix: `cars/${carId}/`,
        token: this.BLOB_READ_WRITE_TOKEN,
      });

      // Delete all files
      const deletePromises = blobs.map(blob => 
        del(blob.url, { token: this.BLOB_READ_WRITE_TOKEN! })
      );

      await Promise.all(deletePromises);
      console.log(`Deleted ${blobs.length} files for car ${carId}`);

    } catch (error) {
      console.error('Error deleting car files:', error);
      // Don't throw - deletion errors shouldn't break the app
    }
  }

  // Generate optimized image URLs using Vercel's image optimization
  private generateOptimizedUrl(originalUrl: string, variant: 'thumbnail' | 'medium' | 'optimized'): string {
    const variantConfig = this.IMAGE_VARIANTS.find(v => v.size === variant);
    if (!variantConfig || !variantConfig.width || !variantConfig.height) {
      return originalUrl;
    }

    // Use Vercel's built-in image optimization
    const baseUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';
    const protocol = baseUrl.includes('localhost') ? 'http://' : 'https://';
    const domain = baseUrl.replace(/^https?:\/\//, '');

    return `${protocol}${domain}/_next/image?url=${encodeURIComponent(originalUrl)}&w=${variantConfig.width}&h=${variantConfig.height}&q=${variantConfig.quality || 85}`;
  }

  // Fallback to base64 storage (current method)
  private async uploadImageFallback(
    file: File, 
    carId: string, 
    type: 'main' | 'gallery',
    index?: number
  ): Promise<BlobUploadResult> {
    try {
      // Compress image before converting to base64
      const compressedFile = await this.compressImage(file);
      const base64 = await this.convertToBase64(compressedFile);
      
      return {
        success: true,
        urls: { original: base64 },
        fileName: `${type}-${index || 0}-${Date.now()}`,
        fileSize: compressedFile.size
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload image using fallback method'
      };
    }
  }

  // Fallback audio upload
  private async uploadAudioFallback(
    file: File, 
    carId: string, 
    type: 'startup' | 'rev'
  ): Promise<BlobUploadResult> {
    try {
      const base64 = await this.convertToBase64(file);
      
      return {
        success: true,
        urls: { original: base64 },
        fileName: `${type}-${Date.now()}`,
        fileSize: file.size
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload audio using fallback method'
      };
    }
  }

  // Image compression utility
  private async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Return original if compression fails
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Convert file to base64
  private async convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }

  // Get file extension
  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || 'jpg';
  }

  // Check if blob storage is configured
  public isConfigured(): boolean {
    return !!this.BLOB_READ_WRITE_TOKEN;
  }

  // Get storage status for admin dashboard
  public getStorageStatus(): { 
    configured: boolean; 
    provider: string; 
    features: string[] 
  } {
    return {
      configured: this.isConfigured(),
      provider: this.isConfigured() ? 'Vercel Blob Storage' : 'Base64 Fallback',
      features: this.isConfigured() 
        ? ['CDN Delivery', 'Image Optimization', 'Multiple Variants', 'Auto WebP']
        : ['Local Storage', 'Basic Compression']
    };
  }
}

// Export singleton instance
export const blobStorage = new BlobStorageService(); 