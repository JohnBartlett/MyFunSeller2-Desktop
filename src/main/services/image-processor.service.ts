import sharp from 'sharp';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ImageProcessingError } from '../utils/errors';
import { ProcessingOptions } from '../../shared/types';

export interface ProcessedImage {
  originalPath: string;
  processedPath: string;
  fileName: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
}

export interface ProcessingProgress {
  completed: number;
  total: number;
  currentFile?: string;
}

export class ImageProcessorService {
  private processedDir: string;
  private originalDir: string;

  constructor() {
    // Use userData directory for storing processed images
    const userDataPath = app.getPath('userData');
    this.processedDir = path.join(userDataPath, '..', '..', 'MyFunSeller2', 'data', 'images', 'processed');
    this.originalDir = path.join(userDataPath, '..', '..', 'MyFunSeller2', 'data', 'images', 'original');
  }

  /**
   * Initialize the image processor service
   * Creates necessary directories
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.processedDir, { recursive: true });
      await fs.mkdir(this.originalDir, { recursive: true });
      console.log('ImageProcessorService initialized');
      console.log(`Processed images dir: ${this.processedDir}`);
      console.log(`Original images dir: ${this.originalDir}`);
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to initialize image processor: ${error.message}`,
        error
      );
    }
  }

  /**
   * Process a single image with specified options
   */
  async processImage(
    sourcePath: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessedImage> {
    try {
      // Validate source file exists
      if (!existsSync(sourcePath)) {
        throw new ImageProcessingError(`Source image not found: ${sourcePath}`);
      }

      let pipeline = sharp(sourcePath);

      // Remove EXIF data (privacy) - default true
      if (options.removeExif !== false) {
        pipeline = pipeline.withMetadata({
          exif: {},
          icc: undefined,
          xmp: undefined,
          iptc: undefined
        });
      }

      // Auto-orient based on EXIF data before processing
      pipeline = pipeline.rotate();

      // Manual rotation (after auto-orient)
      if (options.rotate && options.rotate !== 0) {
        pipeline = pipeline.rotate(options.rotate);
      }

      // Crop
      if (options.crop) {
        pipeline = pipeline.extract({
          left: options.crop.x,
          top: options.crop.y,
          width: options.crop.width,
          height: options.crop.height
        });
      }

      // Resize with smart defaults for marketplace platforms
      if (options.resize) {
        pipeline = pipeline.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: options.resize.fit || 'inside',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        });
      } else {
        // Default: max 1200x1200 (Facebook Marketplace optimal)
        pipeline = pipeline.resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Brightness/Contrast adjustments
      if (options.brightness !== undefined || options.contrast !== undefined) {
        pipeline = pipeline.modulate({
          brightness: options.brightness !== undefined ? 1 + options.brightness : undefined,
          saturation: 1,
          hue: 0
        });

        // Contrast adjustment using normalize or linear
        if (options.contrast !== undefined) {
          if (options.contrast > 0) {
            pipeline = pipeline.normalise();
          } else if (options.contrast < 0) {
            pipeline = pipeline.linear(0.5, 128);
          }
        }
      }

      // Watermark overlay
      if (options.watermark?.imagePath) {
        const watermarkBuffer = await this.prepareWatermark(
          options.watermark.imagePath,
          options.watermark.position || 'bottom-right'
        );

        if (watermarkBuffer) {
          pipeline = pipeline.composite([watermarkBuffer]);
        }
      }

      // Output format and quality
      const format = options.format || 'jpeg';
      const quality = options.quality || 85;

      if (format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      }

      // Generate output path
      const outputFileName = `${uuidv4()}.${format}`;
      const outputPath = path.join(this.processedDir, outputFileName);

      // Ensure directory exists
      await fs.mkdir(this.processedDir, { recursive: true });

      // Process and save
      await pipeline.toFile(outputPath);

      // Get metadata
      const metadata = await sharp(outputPath).metadata();
      const stats = await fs.stat(outputPath);

      return {
        originalPath: sourcePath,
        processedPath: outputPath,
        fileName: outputFileName,
        width: metadata.width || 0,
        height: metadata.height || 0,
        fileSize: stats.size,
        mimeType: `image/${format}`
      };
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to process image ${sourcePath}: ${error.message}`,
        error
      );
    }
  }

  /**
   * Process multiple images in batch with progress tracking
   */
  async batchProcess(
    sourcePaths: string[],
    options: ProcessingOptions = {},
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const total = sourcePaths.length;

    for (let i = 0; i < sourcePaths.length; i++) {
      const sourcePath = sourcePaths[i];

      try {
        const result = await this.processImage(sourcePath, options);
        results.push(result);

        if (onProgress) {
          onProgress({
            completed: i + 1,
            total,
            currentFile: path.basename(sourcePath)
          });
        }
      } catch (error) {
        console.error(`Failed to process ${sourcePath}:`, error);
        // Continue with other images even if one fails
        if (onProgress) {
          onProgress({
            completed: i + 1,
            total,
            currentFile: `ERROR: ${path.basename(sourcePath)}`
          });
        }
      }
    }

    return results;
  }

  /**
   * Optimize image for a specific platform
   */
  async optimizeForPlatform(
    imagePath: string,
    platformName: string
  ): Promise<string> {
    const platformRequirements: Record<string, ProcessingOptions> = {
      facebook_marketplace: {
        resize: { width: 1200, height: 1200, fit: 'inside' },
        format: 'jpeg',
        quality: 85,
        removeExif: true
      },
      ebay: {
        resize: { width: 1600, height: 1600, fit: 'inside' },
        format: 'jpeg',
        quality: 90,
        removeExif: true
      },
      depop: {
        resize: { width: 1200, height: 1200, fit: 'cover' },
        format: 'jpeg',
        quality: 85,
        removeExif: true
      },
      poshmark: {
        resize: { width: 1280, height: 1280, fit: 'inside' },
        format: 'jpeg',
        quality: 85,
        removeExif: true
      },
      mercari: {
        resize: { width: 1200, height: 1200, fit: 'inside' },
        format: 'jpeg',
        quality: 85,
        removeExif: true
      }
    };

    const requirements = platformRequirements[platformName];
    if (!requirements) {
      // No specific optimization needed
      return imagePath;
    }

    const result = await this.processImage(imagePath, requirements);
    return result.processedPath;
  }

  /**
   * Create a thumbnail version of an image
   */
  async createThumbnail(
    imagePath: string,
    width: number = 200,
    height: number = 200
  ): Promise<string> {
    try {
      const thumbnailFileName = `thumb_${uuidv4()}.jpeg`;
      const thumbnailPath = path.join(this.processedDir, thumbnailFileName);

      await sharp(imagePath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      return thumbnailPath;
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to create thumbnail: ${error.message}`,
        error
      );
    }
  }

  /**
   * Get image metadata without processing
   */
  async getImageInfo(imagePath: string): Promise<sharp.Metadata> {
    try {
      return await sharp(imagePath).metadata();
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to get image info: ${error.message}`,
        error
      );
    }
  }

  /**
   * Validate if file is a valid image
   */
  async validateImage(filePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(filePath).metadata();
      return !!(metadata.width && metadata.height);
    } catch {
      return false;
    }
  }

  /**
   * Copy original image to storage
   */
  async saveOriginal(sourcePath: string): Promise<string> {
    try {
      const originalFileName = `${uuidv4()}${path.extname(sourcePath)}`;
      const originalPath = path.join(this.originalDir, originalFileName);

      await fs.mkdir(this.originalDir, { recursive: true });
      await fs.copyFile(sourcePath, originalPath);

      return originalPath;
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to save original image: ${error.message}`,
        error
      );
    }
  }

  /**
   * Delete processed image
   */
  async deleteProcessed(filePath: string): Promise<void> {
    try {
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete processed image ${filePath}:`, error);
      // Don't throw - deletion failures shouldn't break the app
    }
  }

  /**
   * Delete original image
   */
  async deleteOriginal(filePath: string): Promise<void> {
    try {
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete original image ${filePath}:`, error);
    }
  }

  /**
   * Clean up old processed images (older than specified days)
   */
  async cleanupOldImages(daysOld: number = 30): Promise<number> {
    try {
      const files = await fs.readdir(this.processedDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.processedDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old processed images`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old images:', error);
      return 0;
    }
  }

  /**
   * Prepare watermark for compositing
   */
  private async prepareWatermark(
    watermarkPath: string,
    position: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  ): Promise<sharp.OverlayOptions | null> {
    try {
      if (!existsSync(watermarkPath)) {
        console.warn(`Watermark not found: ${watermarkPath}`);
        return null;
      }

      const watermark = sharp(watermarkPath);
      const metadata = await watermark.metadata();

      // Map position to Sharp gravity
      const gravityMap: Record<string, sharp.Gravity> = {
        center: 'center',
        'bottom-right': 'southeast',
        'bottom-left': 'southwest',
        'top-right': 'northeast',
        'top-left': 'northwest'
      };

      const gravity = gravityMap[position] || 'southeast';

      // Ensure watermark has transparency
      const watermarkBuffer = await watermark
        .ensureAlpha()
        .png()
        .toBuffer();

      return {
        input: watermarkBuffer,
        gravity: gravity,
        blend: 'over'
      };
    } catch (error) {
      console.error(`Failed to prepare watermark: ${error.message}`);
      return null;
    }
  }

  /**
   * Get storage paths
   */
  getPaths() {
    return {
      processedDir: this.processedDir,
      originalDir: this.originalDir
    };
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    processedCount: number;
    originalCount: number;
    totalSize: number;
  }> {
    try {
      const [processedFiles, originalFiles] = await Promise.all([
        fs.readdir(this.processedDir).catch(() => []),
        fs.readdir(this.originalDir).catch(() => [])
      ]);

      let totalSize = 0;

      // Calculate total size
      for (const file of [...processedFiles, ...originalFiles]) {
        try {
          const filePath = processedFiles.includes(file)
            ? path.join(this.processedDir, file)
            : path.join(this.originalDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        } catch {
          // Skip files that can't be read
        }
      }

      return {
        processedCount: processedFiles.length,
        originalCount: originalFiles.length,
        totalSize
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        processedCount: 0,
        originalCount: 0,
        totalSize: 0
      };
    }
  }
}

// Export singleton instance
let imageProcessorInstance: ImageProcessorService | null = null;

export const getImageProcessor = async (): Promise<ImageProcessorService> => {
  if (!imageProcessorInstance) {
    imageProcessorInstance = new ImageProcessorService();
    await imageProcessorInstance.initialize();
  }
  return imageProcessorInstance;
};
