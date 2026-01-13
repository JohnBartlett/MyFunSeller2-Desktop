import path from 'path';

/**
 * Image utility functions
 */

export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff'];

export const MIME_TYPE_MAP: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff'
};

/**
 * Check if a file is a supported image format
 */
export function isSupportedImageFormat(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  return SUPPORTED_IMAGE_FORMATS.includes(ext);
}

/**
 * Get image format from file extension
 */
export function getImageFormat(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  return SUPPORTED_IMAGE_FORMATS.includes(ext) ? ext : null;
}

/**
 * Get image format from MIME type
 */
export function getFormatFromMimeType(mimeType: string): string | null {
  return MIME_TYPE_MAP[mimeType.toLowerCase()] || null;
}

/**
 * Convert bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate image dimensions maintaining aspect ratio
 */
export function calculateAspectRatioDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    width = maxWidth;
    height = Math.round(width / aspectRatio);
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * aspectRatio);
  }

  return { width, height };
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  width: number,
  height: number,
  requirements?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (requirements?.minWidth && width < requirements.minWidth) {
    errors.push(`Width must be at least ${requirements.minWidth}px`);
  }

  if (requirements?.minHeight && height < requirements.minHeight) {
    errors.push(`Height must be at least ${requirements.minHeight}px`);
  }

  if (requirements?.maxWidth && width > requirements.maxWidth) {
    errors.push(`Width must not exceed ${requirements.maxWidth}px`);
  }

  if (requirements?.maxHeight && height > requirements.maxHeight) {
    errors.push(`Height must not exceed ${requirements.maxHeight}px`);
  }

  if (requirements?.aspectRatio) {
    const actualRatio = width / height;
    const tolerance = 0.1;
    if (Math.abs(actualRatio - requirements.aspectRatio) > tolerance) {
      errors.push(
        `Aspect ratio must be approximately ${requirements.aspectRatio}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate file size
 */
export function validateFileSize(
  fileSize: number,
  maxSizeMB: number
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (fileSize > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${formatFileSize(fileSize)}) exceeds maximum (${maxSizeMB}MB)`
    };
  }

  return { valid: true };
}

/**
 * Generate safe filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Extract orientation from EXIF data
 */
export function getOrientationFromExif(orientation?: number): number {
  // EXIF orientation values:
  // 1 = Normal
  // 3 = Rotate 180
  // 6 = Rotate 90 CW
  // 8 = Rotate 270 CW
  return orientation || 1;
}

/**
 * Get rotation degrees from EXIF orientation
 */
export function getRotationFromOrientation(orientation: number): number {
  const rotationMap: Record<number, number> = {
    1: 0,
    3: 180,
    6: 90,
    8: 270
  };

  return rotationMap[orientation] || 0;
}

/**
 * Calculate compression quality based on file size
 */
export function calculateOptimalQuality(
  fileSizeBytes: number,
  targetSizeMB: number = 2
): number {
  const targetSizeBytes = targetSizeMB * 1024 * 1024;

  if (fileSizeBytes <= targetSizeBytes) {
    return 90; // High quality
  } else if (fileSizeBytes <= targetSizeBytes * 2) {
    return 85; // Good quality
  } else if (fileSizeBytes <= targetSizeBytes * 4) {
    return 80; // Medium quality
  } else {
    return 70; // Lower quality for large files
  }
}

/**
 * Estimate processed file size
 */
export function estimateProcessedSize(
  originalSize: number,
  quality: number,
  format: 'jpeg' | 'png' | 'webp'
): number {
  // Rough estimates
  const compressionFactors = {
    jpeg: quality / 100,
    webp: quality / 120, // WebP is more efficient
    png: 0.7 // PNG compression is lossless
  };

  const factor = compressionFactors[format] || 0.8;
  return Math.round(originalSize * factor);
}

/**
 * Check if image needs resizing
 */
export function needsResizing(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): boolean {
  return width > maxWidth || height > maxHeight;
}

/**
 * Check if image should be compressed
 */
export function needsCompression(
  fileSizeBytes: number,
  maxSizeMB: number
): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSizeBytes > maxSizeBytes;
}
