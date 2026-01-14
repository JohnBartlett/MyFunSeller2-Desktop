/**
 * IPC Event Channel Constants
 * Centralized definition of all IPC channels for type safety
 */

export const IPC_CHANNELS = {
  // Items
  ITEMS_CREATE: 'items:create',
  ITEMS_FIND_BY_ID: 'items:findById',
  ITEMS_FIND_ALL: 'items:findAll',
  ITEMS_UPDATE: 'items:update',
  ITEMS_DELETE: 'items:delete',
  ITEMS_COUNT: 'items:count',

  // Images
  IMAGES_CREATE: 'images:create',
  IMAGES_FIND_BY_ID: 'images:findById',
  IMAGES_FIND_BY_ITEM: 'images:findByItemId',
  IMAGES_GET_PRIMARY: 'images:getPrimary',
  IMAGES_UPDATE: 'images:update',
  IMAGES_SET_PRIMARY: 'images:setPrimary',
  IMAGES_REORDER: 'images:reorder',
  IMAGES_DELETE: 'images:delete',
  IMAGES_DELETE_BY_ITEM: 'images:deleteByItem',

  // Listings
  LISTINGS_CREATE: 'listings:create',
  LISTINGS_FIND_BY_ID: 'listings:findById',
  LISTINGS_FIND_BY_ITEM: 'listings:findByItemId',
  LISTINGS_FIND_BY_PLATFORM: 'listings:findByPlatformId',
  LISTINGS_FIND_BY_STATUS: 'listings:findByStatus',
  LISTINGS_FIND_SCHEDULED: 'listings:findScheduled',
  LISTINGS_FIND_ALL: 'listings:findAll',
  LISTINGS_UPDATE: 'listings:update',
  LISTINGS_INCREMENT_RETRY: 'listings:incrementRetry',
  LISTINGS_UPDATE_ANALYTICS: 'listings:updateAnalytics',
  LISTINGS_DELETE: 'listings:delete',
  LISTINGS_COUNT: 'listings:count',

  // Platforms
  PLATFORMS_CREATE: 'platforms:create',
  PLATFORMS_FIND_BY_ID: 'platforms:findById',
  PLATFORMS_FIND_BY_NAME: 'platforms:findByName',
  PLATFORMS_FIND_ALL: 'platforms:findAll',
  PLATFORMS_UPDATE: 'platforms:update',
  PLATFORMS_UPDATE_AUTH: 'platforms:updateAuth',
  PLATFORMS_UPDATE_SYNC: 'platforms:updateSync',
  PLATFORMS_TOGGLE_ENABLED: 'platforms:toggleEnabled',
  PLATFORMS_DELETE: 'platforms:delete',

  // Templates
  TEMPLATES_CREATE: 'templates:create',
  TEMPLATES_FIND_BY_ID: 'templates:findById',
  TEMPLATES_FIND_BY_NAME: 'templates:findByName',
  TEMPLATES_FIND_BY_CATEGORY: 'templates:findByCategory',
  TEMPLATES_FIND_ALL: 'templates:findAll',
  TEMPLATES_GET_MOST_USED: 'templates:getMostUsed',
  TEMPLATES_UPDATE: 'templates:update',
  TEMPLATES_INCREMENT_USE: 'templates:incrementUse',
  TEMPLATES_DELETE: 'templates:delete',
  TEMPLATES_COUNT: 'templates:count',

  // Analytics
  ANALYTICS_CREATE: 'analytics:create',
  ANALYTICS_FIND_BY_ID: 'analytics:findById',
  ANALYTICS_FIND_BY_LISTING: 'analytics:findByListingId',
  ANALYTICS_FIND_BY_TYPE: 'analytics:findByEventType',
  ANALYTICS_FIND_IN_RANGE: 'analytics:findInDateRange',
  ANALYTICS_COUNT_BY_TYPE: 'analytics:countByEventType',
  ANALYTICS_GET_SUMMARY: 'analytics:getEventTypeSummary',
  ANALYTICS_GET_LATEST: 'analytics:getLatestEvent',
  ANALYTICS_DELETE: 'analytics:delete',
  ANALYTICS_DELETE_BY_LISTING: 'analytics:deleteByListingId',
  ANALYTICS_DELETE_OLD: 'analytics:deleteOlderThan',

  // Image Processing
  IMAGE_PROCESS: 'image:process',
  IMAGE_BATCH_PROCESS: 'image:batchProcess',
  IMAGE_OPTIMIZE_FOR_PLATFORM: 'image:optimizeForPlatform',
  IMAGE_CREATE_THUMBNAIL: 'image:createThumbnail',
  IMAGE_GET_INFO: 'image:getInfo',
  IMAGE_VALIDATE: 'image:validate',
  IMAGE_SAVE_ORIGINAL: 'image:saveOriginal',
  IMAGE_DELETE_PROCESSED: 'image:deleteProcessed',
  IMAGE_DELETE_ORIGINAL: 'image:deleteOriginal',
  IMAGE_CLEANUP_OLD: 'image:cleanupOld',
  IMAGE_GET_STORAGE_STATS: 'image:getStorageStats',

  // System
  SYSTEM_GET_APP_VERSION: 'system:getAppVersion',
  SYSTEM_GET_PATHS: 'system:getPaths',

  // Claude AI
  CLAUDE_ANALYZE_IMAGES: 'claude:analyzeImages',
  CLAUDE_IS_CONFIGURED: 'claude:isConfigured',
} as const;

// Type for IPC channel names
export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
