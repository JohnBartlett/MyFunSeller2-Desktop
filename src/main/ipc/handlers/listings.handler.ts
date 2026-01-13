import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../events';
import { getDatabase } from '../../database';
import { ListingsRepository } from '../../database/repositories';
import { Listing, ApiResponse } from '../../../shared/types';

export function registerListingsHandlers(): void {
  const db = getDatabase();
  const listingsRepo = new ListingsRepository(db);

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_CREATE,
    async (_, listingData: Omit<Listing, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Listing>> => {
      try {
        const listing = listingsRepo.create(listingData);
        return { success: true, data: listing };
      } catch (error) {
        console.error('Failed to create listing:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_FIND_BY_ID,
    async (_, id: number): Promise<ApiResponse<Listing>> => {
      try {
        const listing = listingsRepo.findById(id);
        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }
        return { success: true, data: listing };
      } catch (error) {
        console.error('Failed to find listing:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_FIND_BY_ITEM,
    async (_, itemId: number): Promise<ApiResponse<Listing[]>> => {
      try {
        const listings = listingsRepo.findByItemId(itemId);
        return { success: true, data: listings };
      } catch (error) {
        console.error('Failed to find listings:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_FIND_BY_PLATFORM,
    async (_, platformId: number): Promise<ApiResponse<Listing[]>> => {
      try {
        const listings = listingsRepo.findByPlatformId(platformId);
        return { success: true, data: listings };
      } catch (error) {
        console.error('Failed to find listings:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_FIND_BY_STATUS,
    async (_, status: Listing['status']): Promise<ApiResponse<Listing[]>> => {
      try {
        const listings = listingsRepo.findByStatus(status);
        return { success: true, data: listings };
      } catch (error) {
        console.error('Failed to find listings:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_FIND_SCHEDULED,
    async (_, beforeDate?: string): Promise<ApiResponse<Listing[]>> => {
      try {
        const date = beforeDate ? new Date(beforeDate) : undefined;
        const listings = listingsRepo.findScheduled(date);
        return { success: true, data: listings };
      } catch (error) {
        console.error('Failed to find scheduled listings:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_FIND_ALL,
    async (_, filters?: { status?: string; platformId?: number; itemId?: number }): Promise<ApiResponse<Listing[]>> => {
      try {
        const listings = listingsRepo.findAll(filters);
        return { success: true, data: listings };
      } catch (error) {
        console.error('Failed to find listings:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_UPDATE,
    async (_, id: number, updates: Partial<Omit<Listing, 'id' | 'item_id' | 'platform_id' | 'created_at'>>): Promise<ApiResponse<Listing>> => {
      try {
        const listing = listingsRepo.update(id, updates);
        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }
        return { success: true, data: listing };
      } catch (error) {
        console.error('Failed to update listing:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_INCREMENT_RETRY,
    async (_, id: number): Promise<ApiResponse<boolean>> => {
      try {
        const success = listingsRepo.incrementRetryCount(id);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to increment retry count:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_UPDATE_ANALYTICS,
    async (_, id: number, analytics: { views?: number; likes?: number; messages?: number }): Promise<ApiResponse<boolean>> => {
      try {
        const success = listingsRepo.updateAnalytics(id, analytics);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to update analytics:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_DELETE,
    async (_, id: number): Promise<ApiResponse<boolean>> => {
      try {
        const success = listingsRepo.delete(id);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to delete listing:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.LISTINGS_COUNT,
    async (_, filters?: { status?: string; platformId?: number }): Promise<ApiResponse<number>> => {
      try {
        const count = listingsRepo.count(filters);
        return { success: true, data: count };
      } catch (error) {
        console.error('Failed to count listings:', error);
        return { success: false, error: error.message };
      }
    }
  );

  console.log('Listings IPC handlers registered');
}
