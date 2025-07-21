// File upload utility for car images and audio files

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class FileUploadService {
  // File size limits (in bytes)
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

  // Supported file types
  private readonly SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/avif'
  ];

  private readonly SUPPORTED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/aac'
  ];

  // Validate file before upload
  validateFile(file: File, type: 'image' | 'audio'): FileValidationResult {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file type
    const supportedTypes = type === 'image' ? this.SUPPORTED_IMAGE_TYPES : this.SUPPORTED_AUDIO_TYPES;
    if (!supportedTypes.includes(file.type)) {
      const typeList = type === 'image' 
        ? 'JPEG, PNG, WebP, AVIF' 
        : 'MP3, WAV, M4A, AAC';
      return { 
        valid: false, 
        error: `Invalid file type. Supported formats: ${typeList}` 
      };
    }

    // Check file size
    const maxSize = type === 'image' ? this.MAX_IMAGE_SIZE : this.MAX_AUDIO_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return { 
        valid: false, 
        error: `File too large. Maximum size: ${maxSizeMB}MB` 
      };
    }

    // Check file name
    if (file.name.length > 100) {
      return { 
        valid: false, 
        error: 'File name too long (max 100 characters)' 
      };
    }

    return { valid: true };
  }

  // Convert file to base64 data URL for preview/storage
  async convertToBase64(file: File): Promise<string> {
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

  // Upload image file
  async uploadImage(file: File, carId?: string): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, 'image');
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // For now, convert to base64 for storage in database
      // In production, you'd upload to a service like AWS S3, Cloudinary, etc.
      const base64 = await this.convertToBase64(file);
      
      // Generate a unique filename
      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFileName(file.name);
      const fileName = carId ? `${carId}_${timestamp}_${sanitizedName}` : `${timestamp}_${sanitizedName}`;

      return {
        success: true,
        url: base64, // In production, this would be the CDN URL
        fileName: fileName,
        fileSize: file.size
      };

    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: 'Failed to upload image. Please try again.'
      };
    }
  }

  // Upload audio file
  async uploadAudio(file: File, carId?: string, type?: 'startup' | 'rev'): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, 'audio');
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Convert to base64 for storage
      const base64 = await this.convertToBase64(file);
      
      // Generate a unique filename
      const timestamp = Date.now();
      const sanitizedName = this.sanitizeFileName(file.name);
      const typePrefix = type ? `${type}_` : '';
      const fileName = carId 
        ? `${carId}_${typePrefix}${timestamp}_${sanitizedName}`
        : `${typePrefix}${timestamp}_${sanitizedName}`;

      return {
        success: true,
        url: base64, // In production, this would be the CDN URL
        fileName: fileName,
        fileSize: file.size
      };

    } catch (error) {
      console.error('Audio upload error:', error);
      return {
        success: false,
        error: 'Failed to upload audio file. Please try again.'
      };
    }
  }

  // Upload multiple images (for gallery)
  async uploadMultipleImages(files: FileList | File[], carId?: string): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];
    const fileArray = Array.from(files);

    // Limit number of files
    if (fileArray.length > 10) {
      return [{
        success: false,
        error: 'Too many files. Maximum 10 images allowed.'
      }];
    }

    // Upload each file
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const result = await this.uploadImage(file, carId);
      results.push(result);
      
      // Stop if any upload fails
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  // Compress image before upload (client-side)
  async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
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

  // Create image preview URL
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Clean up preview URL
  revokePreviewUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  // Sanitize file name
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .toLowerCase();
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file is an image
  isImageFile(file: File): boolean {
    return this.SUPPORTED_IMAGE_TYPES.includes(file.type);
  }

  // Check if file is an audio file
  isAudioFile(file: File): boolean {
    return this.SUPPORTED_AUDIO_TYPES.includes(file.type);
  }

  // Get file extension
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  // Validate multiple files at once
  validateMultipleFiles(files: FileList | File[], type: 'image' | 'audio'): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fileArray = Array.from(files);

    if (fileArray.length === 0) {
      return { valid: false, errors: ['No files selected'] };
    }

    if (type === 'image' && fileArray.length > 10) {
      errors.push('Too many images. Maximum 10 allowed.');
    }

    // Validate each file
    fileArray.forEach((file, index) => {
      const validation = this.validateFile(file, type);
      if (!validation.valid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    return { valid: errors.length === 0, errors };
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService(); 