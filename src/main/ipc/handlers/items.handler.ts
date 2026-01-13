import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../events';
import { getDatabase } from '../../database';
import { ItemsRepository } from '../../database/repositories';
import { Item, ApiResponse } from '../../../shared/types';

export function registerItemsHandlers(): void {
  const db = getDatabase();
  const itemsRepo = new ItemsRepository(db);

  // Create item
  ipcMain.handle(
    IPC_CHANNELS.ITEMS_CREATE,
    async (_, itemData: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Item>> => {
      try {
        const item = itemsRepo.create(itemData);
        return { success: true, data: item };
      } catch (error) {
        console.error('Failed to create item:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Find by ID
  ipcMain.handle(
    IPC_CHANNELS.ITEMS_FIND_BY_ID,
    async (_, id: number): Promise<ApiResponse<Item>> => {
      try {
        const item = itemsRepo.findById(id);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }
        return { success: true, data: item };
      } catch (error) {
        console.error('Failed to find item:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Find all with filters
  ipcMain.handle(
    IPC_CHANNELS.ITEMS_FIND_ALL,
    async (_, filters?: { category?: string; condition?: string; search?: string }): Promise<ApiResponse<Item[]>> => {
      try {
        const items = itemsRepo.findAll(filters);
        return { success: true, data: items };
      } catch (error) {
        console.error('Failed to find items:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Update item
  ipcMain.handle(
    IPC_CHANNELS.ITEMS_UPDATE,
    async (_, id: number, updates: Partial<Omit<Item, 'id' | 'created_at'>>): Promise<ApiResponse<Item>> => {
      try {
        const item = itemsRepo.update(id, updates);
        if (!item) {
          return { success: false, error: 'Item not found' };
        }
        return { success: true, data: item };
      } catch (error) {
        console.error('Failed to update item:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Delete item
  ipcMain.handle(
    IPC_CHANNELS.ITEMS_DELETE,
    async (_, id: number): Promise<ApiResponse<boolean>> => {
      try {
        const success = itemsRepo.delete(id);
        if (!success) {
          return { success: false, error: 'Item not found' };
        }
        return { success: true, data: true };
      } catch (error) {
        console.error('Failed to delete item:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Count items
  ipcMain.handle(
    IPC_CHANNELS.ITEMS_COUNT,
    async (_, filters?: { category?: string; condition?: string }): Promise<ApiResponse<number>> => {
      try {
        const count = itemsRepo.count(filters);
        return { success: true, data: count };
      } catch (error) {
        console.error('Failed to count items:', error);
        return { success: false, error: error.message };
      }
    }
  );

  console.log('Items IPC handlers registered');
}
