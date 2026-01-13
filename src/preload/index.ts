import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { IPC_CHANNELS } from '../main/ipc/events';
import type { Item, Image, Listing, Platform, Template, AnalyticsEvent } from '../shared/types';

// Type-safe IPC API
const api = {
  // Items API
  items: {
    create: (item: Omit<Item, 'id'>) => ipcRenderer.invoke(IPC_CHANNELS.ITEMS_CREATE, item),
    findById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.ITEMS_FIND_BY_ID, id),
    findAll: () => ipcRenderer.invoke(IPC_CHANNELS.ITEMS_FIND_ALL),
    update: (id: number, data: Partial<Item>) => ipcRenderer.invoke(IPC_CHANNELS.ITEMS_UPDATE, id, data),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.ITEMS_DELETE, id),
    count: () => ipcRenderer.invoke(IPC_CHANNELS.ITEMS_COUNT),
  },

  // Images API
  images: {
    create: (image: Omit<Image, 'id'>) => ipcRenderer.invoke(IPC_CHANNELS.IMAGES_CREATE, image),
    findById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.IMAGES_FIND_BY_ID, id),
    findByItemId: (itemId: number) => ipcRenderer.invoke(IPC_CHANNELS.IMAGES_FIND_BY_ITEM, itemId),
    getPrimary: (itemId: number) => ipcRenderer.invoke(IPC_CHANNELS.IMAGES_GET_PRIMARY, itemId),
    update: (id: number, data: Partial<Image>) => ipcRenderer.invoke(IPC_CHANNELS.IMAGES_UPDATE, id, data),
    setPrimary: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.IMAGES_SET_PRIMARY, id),
    reorder: (itemId: number, imageIds: number[]) => ipcRenderer.invoke(IPC_CHANNELS.IMAGES_REORDER, itemId, imageIds),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.IMAGES_DELETE, id),
    deleteByItem: (itemId: number) => ipcRenderer.invoke(IPC_CHANNELS.IMAGES_DELETE_BY_ITEM, itemId),
  },

  // Listings API
  listings: {
    create: (listing: Omit<Listing, 'id'>) => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_CREATE, listing),
    findById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_FIND_BY_ID, id),
    findByItemId: (itemId: number) => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_FIND_BY_ITEM, itemId),
    findByPlatformId: (platformId: number) => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_FIND_BY_PLATFORM, platformId),
    findByStatus: (status: string) => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_FIND_BY_STATUS, status),
    findScheduled: () => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_FIND_SCHEDULED),
    findAll: () => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_FIND_ALL),
    update: (id: number, data: Partial<Listing>) => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_UPDATE, id, data),
    incrementRetry: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_INCREMENT_RETRY, id),
    updateAnalytics: (id: number, views?: number, likes?: number, messages?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_UPDATE_ANALYTICS, id, views, likes, messages),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_DELETE, id),
    count: () => ipcRenderer.invoke(IPC_CHANNELS.LISTINGS_COUNT),
  },

  // Platforms API
  platforms: {
    create: (platform: Omit<Platform, 'id'>) => ipcRenderer.invoke(IPC_CHANNELS.PLATFORMS_CREATE, platform),
    findById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.PLATFORMS_FIND_BY_ID, id),
    findByName: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.PLATFORMS_FIND_BY_NAME, name),
    findAll: () => ipcRenderer.invoke(IPC_CHANNELS.PLATFORMS_FIND_ALL),
    update: (id: number, data: Partial<Platform>) => ipcRenderer.invoke(IPC_CHANNELS.PLATFORMS_UPDATE, id, data),
    updateAuth: (id: number, authData: string) => ipcRenderer.invoke(IPC_CHANNELS.PLATFORMS_UPDATE_AUTH, id, authData),
    updateSync: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.PLATFORMS_UPDATE_SYNC, id),
    toggleEnabled: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.PLATFORMS_TOGGLE_ENABLED, id),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.PLATFORMS_DELETE, id),
  },

  // Templates API
  templates: {
    create: (template: Omit<Template, 'id'>) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_CREATE, template),
    findById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_FIND_BY_ID, id),
    findByName: (name: string) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_FIND_BY_NAME, name),
    findByCategory: (category: string) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_FIND_BY_CATEGORY, category),
    findAll: () => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_FIND_ALL),
    getMostUsed: (limit: number) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_GET_MOST_USED, limit),
    update: (id: number, data: Partial<Template>) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_UPDATE, id, data),
    incrementUse: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_INCREMENT_USE, id),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_DELETE, id),
    count: () => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATES_COUNT),
  },

  // Analytics API
  analytics: {
    create: (event: Omit<AnalyticsEvent, 'id'>) => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_CREATE, event),
    findById: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_FIND_BY_ID, id),
    findByListingId: (listingId: number) => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_FIND_BY_LISTING, listingId),
    findByEventType: (eventType: string) => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_FIND_BY_TYPE, eventType),
    findInDateRange: (startDate: string, endDate: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_FIND_IN_RANGE, startDate, endDate),
    countByEventType: (listingId: number, eventType: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_COUNT_BY_TYPE, listingId, eventType),
    getEventTypeSummary: (listingId: number) => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_GET_SUMMARY, listingId),
    getLatestEvent: (listingId: number, eventType: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_GET_LATEST, listingId, eventType),
    delete: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_DELETE, id),
    deleteByListingId: (listingId: number) => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_DELETE_BY_LISTING, listingId),
    deleteOlderThan: (days: number) => ipcRenderer.invoke(IPC_CHANNELS.ANALYTICS_DELETE_OLD, days),
  },

  // Image Processing API
  imageProcessor: {
    process: (imagePath: string, options: any) => ipcRenderer.invoke(IPC_CHANNELS.IMAGE_PROCESS, imagePath, options),
    batchProcess: (imagePaths: string[], options: any, onProgress?: (progress: any) => void) =>
      ipcRenderer.invoke(IPC_CHANNELS.IMAGE_BATCH_PROCESS, imagePaths, options),
    optimizeForPlatform: (imagePath: string, platform: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.IMAGE_OPTIMIZE_FOR_PLATFORM, imagePath, platform),
    createThumbnail: (imagePath: string, size?: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.IMAGE_CREATE_THUMBNAIL, imagePath, size),
    getInfo: (imagePath: string) => ipcRenderer.invoke(IPC_CHANNELS.IMAGE_GET_INFO, imagePath),
    validate: (imagePath: string) => ipcRenderer.invoke(IPC_CHANNELS.IMAGE_VALIDATE, imagePath),
    saveOriginal: (imagePath: string) => ipcRenderer.invoke(IPC_CHANNELS.IMAGE_SAVE_ORIGINAL, imagePath),
    deleteProcessed: (fileName: string) => ipcRenderer.invoke(IPC_CHANNELS.IMAGE_DELETE_PROCESSED, fileName),
    deleteOriginal: (fileName: string) => ipcRenderer.invoke(IPC_CHANNELS.IMAGE_DELETE_ORIGINAL, fileName),
    cleanupOld: (days: number) => ipcRenderer.invoke(IPC_CHANNELS.IMAGE_CLEANUP_OLD, days),
    getStorageStats: () => ipcRenderer.invoke(IPC_CHANNELS.IMAGE_GET_STORAGE_STATS),
  },

  // System API
  system: {
    getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_APP_VERSION),
    getPaths: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_PATHS),
  },
};

// Expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error('Failed to expose APIs:', error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}

// Export type for TypeScript support
export type ElectronAPI = typeof api;
