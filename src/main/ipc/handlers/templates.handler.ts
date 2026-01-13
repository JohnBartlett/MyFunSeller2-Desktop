import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../events';
import { getDatabase } from '../../database';
import { TemplatesRepository } from '../../database/repositories';
import { Template, ApiResponse } from '../../../shared/types';

export function registerTemplatesHandlers(): void {
  const db = getDatabase();
  const templatesRepo = new TemplatesRepository(db);

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_CREATE,
    async (_, templateData: Omit<Template, 'id' | 'use_count' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Template>> => {
      try {
        const template = templatesRepo.create(templateData);
        return { success: true, data: template };
      } catch (error) {
        console.error('Failed to create template:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_FIND_BY_ID,
    async (_, id: number): Promise<ApiResponse<Template>> => {
      try {
        const template = templatesRepo.findById(id);
        if (!template) {
          return { success: false, error: 'Template not found' };
        }
        return { success: true, data: template };
      } catch (error) {
        console.error('Failed to find template:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_FIND_BY_NAME,
    async (_, name: string): Promise<ApiResponse<Template>> => {
      try {
        const template = templatesRepo.findByName(name);
        if (!template) {
          return { success: false, error: 'Template not found' };
        }
        return { success: true, data: template };
      } catch (error) {
        console.error('Failed to find template:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_FIND_BY_CATEGORY,
    async (_, category: string): Promise<ApiResponse<Template[]>> => {
      try {
        const templates = templatesRepo.findByCategory(category);
        return { success: true, data: templates };
      } catch (error) {
        console.error('Failed to find templates:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_FIND_ALL,
    async (): Promise<ApiResponse<Template[]>> => {
      try {
        const templates = templatesRepo.findAll();
        return { success: true, data: templates };
      } catch (error) {
        console.error('Failed to find templates:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_GET_MOST_USED,
    async (_, limit: number = 10): Promise<ApiResponse<Template[]>> => {
      try {
        const templates = templatesRepo.getMostUsed(limit);
        return { success: true, data: templates };
      } catch (error) {
        console.error('Failed to get most used templates:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_UPDATE,
    async (_, id: number, updates: Partial<Omit<Template, 'id' | 'use_count' | 'created_at'>>): Promise<ApiResponse<Template>> => {
      try {
        const template = templatesRepo.update(id, updates);
        if (!template) {
          return { success: false, error: 'Template not found' };
        }
        return { success: true, data: template };
      } catch (error) {
        console.error('Failed to update template:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_INCREMENT_USE,
    async (_, id: number): Promise<ApiResponse<boolean>> => {
      try {
        const success = templatesRepo.incrementUseCount(id);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to increment use count:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_DELETE,
    async (_, id: number): Promise<ApiResponse<boolean>> => {
      try {
        const success = templatesRepo.delete(id);
        return { success, data: success };
      } catch (error) {
        console.error('Failed to delete template:', error);
        return { success: false, error: error.message };
      }
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATES_COUNT,
    async (_, category?: string): Promise<ApiResponse<number>> => {
      try {
        const count = templatesRepo.count(category);
        return { success: true, data: count };
      } catch (error) {
        console.error('Failed to count templates:', error);
        return { success: false, error: error.message };
      }
    }
  );

  console.log('Templates IPC handlers registered');
}
