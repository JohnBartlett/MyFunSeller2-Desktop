import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { initializeDatabase } from './database';
import { getImageProcessor } from './services';
import { registerItemsHandlers } from './ipc/handlers/items.handler';
import { registerImagesHandlers } from './ipc/handlers/images.handler';
import { registerListingsHandlers } from './ipc/handlers/listings.handler';
import { registerPlatformsHandlers } from './ipc/handlers/platforms.handler';
import { registerTemplatesHandlers } from './ipc/handlers/templates.handler';
import { IPC_CHANNELS } from './ipc/events';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    require('electron').shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load the remote URL for development or the local html file for production
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.myfunseller');

  // Initialize services
  try {
    initializeDatabase();
    console.log('Database initialized successfully');

    // Register IPC handlers
    registerItemsHandlers();
    registerImagesHandlers();
    registerListingsHandlers();
    registerPlatformsHandlers();
    registerTemplatesHandlers();

    // Register system handlers
    ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_APP_VERSION, () => app.getVersion());
    ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PATHS, () => ({
      userData: app.getPath('userData'),
      documents: app.getPath('documents'),
      downloads: app.getPath('downloads'),
      pictures: app.getPath('pictures'),
    }));

    console.log('IPC handlers registered successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  // Initialize image processor
  getImageProcessor()
    .then(() => {
      console.log('Image processor initialized successfully');
    })
    .catch((error) => {
      console.error('Failed to initialize image processor:', error);
    });

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
