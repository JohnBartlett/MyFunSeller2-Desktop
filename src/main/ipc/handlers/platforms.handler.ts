import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../events';
import { getDatabase } from '../../database';
import { PlatformsRepository } from '../../database/repositories';
import { Platform, ApiResponse } from '../../../shared/types';

export function registerPlatformsHandlers(): void {
  const db = getDatabase();
  const platformsRepo = new PlatformsRepository(db);

  ipcMain.handle(
    IPC_CHANNELS.PLATFORMS_CREATE,
    async (_, platformData: Omit<Platform, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Platform>> => {
      try {
        const platform = platformsRepo.create(platformData);
        return { success: true, data: platform };
      } catch (error) {
        console.error('Failed to create platform:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PLATFORMS_FIND_BY_ID,
    async (_, id: number): Promise<ApiResponse<Platform>> => {
      try {
        const platform = platformsRepo.findById(id);
        if (!platform) {
          return { success: false, error: 'Platform not found' };
        }
        return { success: true, data: platform };
      } catch (error) {
        console.error('Failed to find platform:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PLATFORMS_FIND_BY_NAME,
    async (_, name: string): Promise<ApiResponse<Platform>> => {
      try {
        const platform = platformsRepo.findByName(name);
        if (!platform) {
          return { success: false, error: 'Platform not found' };
        }
        return { success: true, data: platform };
      } catch (error) {
        console.error('Failed to find platform:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PLATFORMS_FIND_ALL,
    async (_, enabledOnly: boolean = false): Promise<ApiResponse<Platform[]>> => {
      try {
        const platforms = platformsRepo.findAll(enabledOnly);
        return { success: true, data: platforms };
      } catch (error) {
        console.error('Failed to find platforms:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PLATFORMS_UPDATE,
    async (_, id: number, updates: Partial<Omit<Platform, 'id' | 'created_at'>>): Promise<ApiResponse<Platform>> => {
      try {
        const platform = platformsRepo.update(id, updates);
        if (!platform) {
          return { success: false, error: 'Platform not found' };
        }
        return { success: true, data: platform };
      } catch (error) {
        console.error('Failed to update platform:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PLATFORMS_UPDATE_AUTH,
    async (_, id: number, authData: string): Promise<ApiResponse<boolean>> => {
      try {
        const success = platformsRepo.updateAuthData(id, authData);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to update auth data:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PLATFORMS_UPDATE_SYNC,
    async (_, id: number, syncTime?: string): Promise<ApiResponse<boolean>> => {
      try {
        const date = syncTime ? new Date(syncTime) : undefined;
        const success = platformsRepo.updateLastSync(id, date);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to update sync time:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PLATFORMS_TOGGLE_ENABLED,
    async (_, id: number): Promise<ApiResponse<boolean>> => {
      try {
        const success = platformsRepo.toggleEnabled(id);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to toggle platform:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PLATFORMS_DELETE,
    async (_, id: number): Promise<ApiResponse<boolean>> => {
      try {
        const success = platformsRepo.delete(id);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to delete platform:', error);
        return { success: false, error: error.message };
      }
    }
  );

  console.log('Platforms IPC handlers registered');
}
