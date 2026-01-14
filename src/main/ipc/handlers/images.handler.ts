import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../events';
import { getDatabase } from '../../database';
import { ImagesRepository } from '../../database/repositories';
import { getImageProcessor } from '../../services';
import { Image, ApiResponse, ProcessingOptions } from '../../../shared/types';
import { ProcessedImage } from '../../services/image-processor.service';

export function registerImagesHandlers(): void {
  const db = getDatabase();
  const imagesRepo = new ImagesRepository(db);

  // Create image record
  ipcMain.handle(
    IPC_CHANNELS.IMAGES_CREATE,
    async (_, imageData: Omit<Image, 'id' | 'created_at'>): Promise<ApiResponse<Image>> => {
      try {
        const image = imagesRepo.create(imageData);
        return { success: true, data: image };
      } catch (error) {
        console.error('Failed to create image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Find by ID
  ipcMain.handle(
    IPC_CHANNELS.IMAGES_FIND_BY_ID,
    async (_, id: number): Promise<ApiResponse<Image>> => {
      try {
        const image = imagesRepo.findById(id);
        if (!image) {
          return { success: false, error: 'Image not found' };
        }
        return { success: true, data: image };
      } catch (error) {
        console.error('Failed to find image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Find by item ID
  ipcMain.handle(
    IPC_CHANNELS.IMAGES_FIND_BY_ITEM,
    async (_, itemId: number): Promise<ApiResponse<Image[]>> => {
      try {
        const images = imagesRepo.findByItemId(itemId);
        return { success: true, data: images };
      } catch (error) {
        console.error('Failed to find images:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Get primary image
  ipcMain.handle(
    IPC_CHANNELS.IMAGES_GET_PRIMARY,
    async (_, itemId: number): Promise<ApiResponse<Image>> => {
      try {
        const image = imagesRepo.getPrimaryImage(itemId);
        if (!image) {
          return { success: false, error: 'No primary image found' };
        }
        return { success: true, data: image };
      } catch (error) {
        console.error('Failed to get primary image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Update image
  ipcMain.handle(
    IPC_CHANNELS.IMAGES_UPDATE,
    async (_, id: number, updates: Partial<Omit<Image, 'id' | 'item_id' | 'created_at'>>): Promise<ApiResponse<Image>> => {
      try {
        const image = imagesRepo.update(id, updates);
        if (!image) {
          return { success: false, error: 'Image not found' };
        }
        return { success: true, data: image };
      } catch (error) {
        console.error('Failed to update image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Set primary image
  ipcMain.handle(
    IPC_CHANNELS.IMAGES_SET_PRIMARY,
    async (_, itemId: number, imageId: number): Promise<ApiResponse<boolean>> => {
      try {
        const success = imagesRepo.setPrimaryImage(itemId, imageId);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to set primary image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Reorder images
  ipcMain.handle(
    IPC_CHANNELS.IMAGES_REORDER,
    async (_, itemId: number, imageIds: number[]): Promise<ApiResponse<boolean>> => {
      try {
        const success = imagesRepo.reorderImages(itemId, imageIds);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to reorder images:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Delete image
  ipcMain.handle(
    IPC_CHANNELS.IMAGES_DELETE,
    async (_, id: number): Promise<ApiResponse<boolean>> => {
      try {
        const success = imagesRepo.delete(id);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to delete image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Delete by item ID
  ipcMain.handle(
    IPC_CHANNELS.IMAGES_DELETE_BY_ITEM,
    async (_, itemId: number): Promise<ApiResponse<number>> => {
      try {
        const count = imagesRepo.deleteByItemId(itemId);
        return { success: true, data: count };
      } catch (error) {
        console.error('Failed to delete images:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Image processing handlers
  ipcMain.handle(
    IPC_CHANNELS.IMAGE_PROCESS,
    async (_, sourcePath: string, options?: ProcessingOptions): Promise<ApiResponse<ProcessedImage>> => {
      try {
        const processor = await getImageProcessor();
        const result = await processor.processImage(sourcePath, options);
        return { success: true, data: result };
      } catch (error) {
        console.error('Failed to process image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.IMAGE_BATCH_PROCESS,
    async (_, sourcePaths: string[], options?: ProcessingOptions): Promise<ApiResponse<ProcessedImage[]>> => {
      try {
        const processor = await getImageProcessor();
        const results = await processor.batchProcess(sourcePaths, options);
        return { success: true, data: results };
      } catch (error) {
        console.error('Failed to batch process images:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.IMAGE_OPTIMIZE_FOR_PLATFORM,
    async (_, imagePath: string, platformName: string): Promise<ApiResponse<string>> => {
      try {
        const processor = await getImageProcessor();
        const result = await processor.optimizeForPlatform(imagePath, platformName);
        return { success: true, data: result };
      } catch (error) {
        console.error('Failed to optimize image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.IMAGE_CREATE_THUMBNAIL,
    async (_, imagePath: string, width?: number, height?: number): Promise<ApiResponse<string>> => {
      try {
        const processor = await getImageProcessor();
        const result = await processor.createThumbnail(imagePath, width, height);
        return { success: true, data: result };
      } catch (error) {
        console.error('Failed to create thumbnail:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.IMAGE_GET_INFO,
    async (_, imagePath: string): Promise<ApiResponse<any>> => {
      try {
        const processor = await getImageProcessor();
        const info = await processor.getImageInfo(imagePath);
        return { success: true, data: info };
      } catch (error) {
        console.error('Failed to get image info:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.IMAGE_VALIDATE,
    async (_, filePath: string): Promise<ApiResponse<boolean>> => {
      try {
        const processor = await getImageProcessor();
        const isValid = await processor.validateImage(filePath);
        return { success: true, data: isValid };
      } catch (error) {
        console.error('Failed to validate image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.IMAGE_SAVE_ORIGINAL,
    async (_, sourcePath: string): Promise<ApiResponse<string>> => {
      try {
        const processor = await getImageProcessor();
        const savedPath = await processor.saveOriginal(sourcePath);
        return { success: true, data: savedPath };
      } catch (error) {
        console.error('Failed to save original image:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.IMAGE_GET_STORAGE_STATS,
    async (): Promise<ApiResponse<{ processedCount: number; originalCount: number; totalSize: number }>> => {
      try {
        const processor = await getImageProcessor();
        const stats = await processor.getStorageStats();
        return { success: true, data: stats };
      } catch (error) {
        console.error('Failed to get storage stats:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Convert HEIC to JPEG for preview
  ipcMain.handle(
    'IMAGE_CONVERT_HEIC_FOR_PREVIEW',
    async (_, filePath: string): Promise<ApiResponse<string>> => {
      try {
        const fs = require('fs');
        const path = require('path');
        const heicConvert = require('heic-convert');

        console.log('Converting HEIC to JPEG for preview:', filePath);

        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.heic' && ext !== '.heif') {
          return { success: false, error: 'Not a HEIC file' };
        }

        const heicBuffer = fs.readFileSync(filePath);
        const outputBuffer = await heicConvert({
          buffer: heicBuffer,
          format: 'JPEG',
          quality: 0.8, // Lower quality for preview
        });

        const jpegBase64 = Buffer.from(outputBuffer).toString('base64');
        const dataUrl = `data:image/jpeg;base64,${jpegBase64}`;

        console.log('HEIC converted to JPEG preview, size:', dataUrl.length);
        return { success: true, data: dataUrl };
      } catch (error) {
        console.error('Failed to convert HEIC for preview:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Load image as data URL for display (handles HEIC conversion)
  ipcMain.handle(
    'IMAGE_LOAD_FOR_DISPLAY',
    async (_, filePath: string): Promise<ApiResponse<string>> => {
      try {
        const fs = require('fs');
        const path = require('path');
        const heicConvert = require('heic-convert');

        if (!fs.existsSync(filePath)) {
          return { success: false, error: 'File not found' };
        }

        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.heic' || ext === '.heif') {
          // Convert HEIC to JPEG
          const heicBuffer = fs.readFileSync(filePath);
          const outputBuffer = await heicConvert({
            buffer: heicBuffer,
            format: 'JPEG',
            quality: 0.6, // Lower quality for thumbnails
          });
          const jpegBase64 = Buffer.from(outputBuffer).toString('base64');
          return { success: true, data: `data:image/jpeg;base64,${jpegBase64}` };
        } else {
          // For other formats, just convert to base64
          const imageBuffer = fs.readFileSync(filePath);
          const mimeTypes: any = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
          };
          const mimeType = mimeTypes[ext] || 'image/jpeg';
          const base64 = imageBuffer.toString('base64');
          return { success: true, data: `data:${mimeType};base64,${base64}` };
        }
      } catch (error) {
        console.error('Failed to load image for display:', error);
        return { success: false, error: error.message };
      }
    }
  );

  console.log('Images IPC handlers registered');
}
