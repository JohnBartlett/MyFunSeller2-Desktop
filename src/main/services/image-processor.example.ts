/**
 * ImageProcessorService Usage Examples
 *
 * This file demonstrates how to use the ImageProcessorService
 * for various image processing tasks.
 */

import { getImageProcessor } from './image-processor.service';
import { ProcessingOptions } from '../../shared/types';

export async function exampleUsage() {
  const imageProcessor = await getImageProcessor();

  // Example 1: Basic image processing with defaults
  // - Auto-resize to 1200x1200
  // - Remove EXIF data
  // - JPEG format at 85% quality
  const result1 = await imageProcessor.processImage('/path/to/image.jpg');
  console.log('Processed:', result1.processedPath);

  // Example 2: Custom resize options
  const options2: ProcessingOptions = {
    resize: {
      width: 800,
      height: 600,
      fit: 'cover' // Will crop to exact dimensions
    },
    quality: 90,
    format: 'jpeg'
  };
  const result2 = await imageProcessor.processImage('/path/to/image.jpg', options2);

  // Example 3: Add watermark
  const options3: ProcessingOptions = {
    watermark: {
      imagePath: '/path/to/watermark.png',
      position: 'bottom-right'
    },
    quality: 85
  };
  const result3 = await imageProcessor.processImage('/path/to/image.jpg', options3);

  // Example 4: Crop and rotate
  const options4: ProcessingOptions = {
    crop: {
      x: 100,
      y: 100,
      width: 500,
      height: 500
    },
    rotate: 90, // Rotate 90 degrees clockwise
    quality: 85
  };
  const result4 = await imageProcessor.processImage('/path/to/image.jpg', options4);

  // Example 5: Adjust brightness and contrast
  const options5: ProcessingOptions = {
    brightness: 0.2, // Increase brightness by 20%
    contrast: 0.1,   // Increase contrast by 10%
    quality: 85
  };
  const result5 = await imageProcessor.processImage('/path/to/image.jpg', options5);

  // Example 6: Batch processing with progress tracking
  const imagePaths = [
    '/path/to/image1.jpg',
    '/path/to/image2.jpg',
    '/path/to/image3.jpg'
  ];

  const batchOptions: ProcessingOptions = {
    resize: { width: 1200, height: 1200 },
    watermark: {
      imagePath: '/path/to/watermark.png',
      position: 'bottom-right'
    },
    quality: 85
  };

  const results = await imageProcessor.batchProcess(
    imagePaths,
    batchOptions,
    (progress) => {
      console.log(`Processing: ${progress.completed}/${progress.total}`);
      console.log(`Current file: ${progress.currentFile}`);
    }
  );

  console.log(`Processed ${results.length} images`);

  // Example 7: Platform-specific optimization
  const fbOptimized = await imageProcessor.optimizeForPlatform(
    '/path/to/image.jpg',
    'facebook_marketplace'
  );
  console.log('Optimized for Facebook:', fbOptimized);

  // Example 8: Create thumbnail
  const thumbnailPath = await imageProcessor.createThumbnail(
    '/path/to/image.jpg',
    200, // width
    200  // height
  );
  console.log('Thumbnail created:', thumbnailPath);

  // Example 9: Get image metadata
  const metadata = await imageProcessor.getImageInfo('/path/to/image.jpg');
  console.log('Image info:', {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
    hasAlpha: metadata.hasAlpha
  });

  // Example 10: Validate image
  const isValid = await imageProcessor.validateImage('/path/to/file.jpg');
  console.log('Is valid image:', isValid);

  // Example 11: Save original and process
  const originalPath = await imageProcessor.saveOriginal('/path/to/upload.jpg');
  const processed = await imageProcessor.processImage(originalPath);
  console.log('Original saved:', originalPath);
  console.log('Processed:', processed.processedPath);

  // Example 12: Storage management
  const stats = await imageProcessor.getStorageStats();
  console.log('Storage stats:', {
    processedCount: stats.processedCount,
    originalCount: stats.originalCount,
    totalSize: `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`
  });

  // Example 13: Cleanup old images
  const deletedCount = await imageProcessor.cleanupOldImages(30); // 30 days
  console.log(`Cleaned up ${deletedCount} old images`);

  // Example 14: Convert to WebP format
  const webpOptions: ProcessingOptions = {
    format: 'webp',
    quality: 80, // WebP can use lower quality with good results
    resize: { width: 1200, height: 1200 }
  };
  const webpResult = await imageProcessor.processImage(
    '/path/to/image.jpg',
    webpOptions
  );
  console.log('WebP image:', webpResult.processedPath);

  // Example 15: Complete workflow for item listing
  async function processItemImages(uploadPaths: string[]) {
    const processor = await getImageProcessor();
    const processedImages = [];

    for (let i = 0; i < uploadPaths.length; i++) {
      try {
        // Save original
        const originalPath = await processor.saveOriginal(uploadPaths[i]);

        // Process with watermark and optimization
        const processed = await processor.processImage(originalPath, {
          resize: { width: 1200, height: 1200 },
          watermark: {
            imagePath: '/app/resources/watermark.png',
            position: 'bottom-right'
          },
          quality: 85,
          removeExif: true
        });

        // Create thumbnail
        const thumbnail = await processor.createThumbnail(processed.processedPath);

        processedImages.push({
          original: originalPath,
          processed: processed.processedPath,
          thumbnail: thumbnail,
          isPrimary: i === 0,
          displayOrder: i
        });
      } catch (error) {
        console.error(`Failed to process image ${i}:`, error);
      }
    }

    return processedImages;
  }

  // Use the workflow
  const itemImages = await processItemImages([
    '/uploads/img1.jpg',
    '/uploads/img2.jpg',
    '/uploads/img3.jpg'
  ]);

  console.log('Item images ready:', itemImages);
}

/**
 * Platform-specific optimization examples
 */
export async function platformOptimizationExamples() {
  const processor = await getImageProcessor();

  // Facebook Marketplace - 1200x1200, JPEG 85%
  const fbImage = await processor.optimizeForPlatform(
    '/path/to/image.jpg',
    'facebook_marketplace'
  );

  // eBay - 1600x1600, JPEG 90%
  const ebayImage = await processor.optimizeForPlatform(
    '/path/to/image.jpg',
    'ebay'
  );

  // Depop - 1200x1200 square crop, JPEG 85%
  const depopImage = await processor.optimizeForPlatform(
    '/path/to/image.jpg',
    'depop'
  );

  return { fbImage, ebayImage, depopImage };
}

/**
 * Error handling examples
 */
export async function errorHandlingExamples() {
  const processor = await getImageProcessor();

  try {
    // This will throw ImageProcessingError if file doesn't exist
    await processor.processImage('/nonexistent/file.jpg');
  } catch (error) {
    if (error.code === 'IMAGE_PROCESSING_ERROR') {
      console.error('Image processing failed:', error.message);
      // Handle gracefully - show user-friendly error message
    }
  }

  try {
    // Validate before processing
    const isValid = await processor.validateImage('/path/to/file.jpg');
    if (!isValid) {
      console.error('Invalid image file');
      return;
    }

    const result = await processor.processImage('/path/to/file.jpg');
    console.log('Success:', result);
  } catch (error) {
    console.error('Processing failed:', error);
  }
}
