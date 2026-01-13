import { ElectronAPI } from '@electron-toolkit/preload';
import type { ElectronAPI as CustomAPI } from './index';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: CustomAPI;
  }
}
