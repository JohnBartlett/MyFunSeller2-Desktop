import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../events';
import { getClaudeService } from '../../services';
import type { ItemAnalysis, UserCorrections } from '../../services';
import { ApiResponse } from '../../../shared/types';

export function registerClaudeHandlers(): void {
  const claudeService = getClaudeService();

  // Check if Claude is configured
  ipcMain.handle(
    IPC_CHANNELS.CLAUDE_IS_CONFIGURED,
    async (): Promise<ApiResponse<boolean>> => {
      try {
        const isReady = claudeService.isReady();
        return { success: true, data: isReady };
      } catch (error: any) {
        console.error('Failed to check Claude configuration:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Analyze images
  ipcMain.handle(
    IPC_CHANNELS.CLAUDE_ANALYZE_IMAGES,
    async (_, imagePaths: string[], userCorrections?: UserCorrections): Promise<ApiResponse<ItemAnalysis>> => {
      try {
        if (!claudeService.isReady()) {
          return {
            success: false,
            error: 'Claude AI is not configured. Please add your ANTHROPIC_API_KEY to the .env file in the app directory.',
          };
        }

        const analysis = await claudeService.analyzeImages(imagePaths, userCorrections);
        return { success: true, data: analysis };
      } catch (error: any) {
        console.error('Failed to analyze images:', error);
        return { success: false, error: error.message };
      }
    }
  );

  console.log('Claude AI IPC handlers registered');
}
