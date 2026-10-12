const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Parse .env file securely with production fallbacks
function getFirebaseEnvConfig() {
  // Built-in default Firebase config so the packaged desktop app works out-of-the-box
  const config = {
    apiKey: 'AIzaSyAvUN-EcCtNhzF9O3XMb2y5wVMpebiDrQU',
    authDomain: 'protec-automobile.firebaseapp.com',
    projectId: 'protec-automobile',
    storageBucket: 'protec-automobile.firebasestorage.app',
    messagingSenderId: '665325317626',
    appId: '1:665325317626:web:17564089c52940bce9c843',
    measurementId: 'G-ZNJSJ5VNSX'
  };

  // Potential locations for .env:
  // 1. Packaged app root (next to .exe via extraFiles)
  // 2. Packaged app resources folder
  // 3. Dev mode project root (two levels up from src/main)
  // 4. Current working directory
  const candidatePaths = [
    path.join(path.dirname(app.getPath('exe')), '.env'),
    path.join(process.resourcesPath || '', '.env'),
    path.join(process.resourcesPath || '', '..', '.env'),
    path.join(__dirname, '../../.env'),
    path.join(process.cwd(), '.env')
  ];

  const envPath = candidatePaths.find(p => p && fs.existsSync(p));
  console.log('[Main] Loading .env from:', envPath || 'none (using built-in config)');

  if (envPath && fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex !== -1) {
          const key = trimmed.substring(0, equalsIndex).trim();
          let value = trimmed.substring(equalsIndex + 1).trim();
          // Remove trailing comma if present
          if (value.endsWith(',')) value = value.slice(0, -1).trim();
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          if (key === 'FIREBASE_API_KEY' && value) config.apiKey = value;
          if (key === 'FIREBASE_AUTH_DOMAIN' && value) config.authDomain = value;
          if (key === 'FIREBASE_PROJECT_ID' && value) config.projectId = value;
          if (key === 'FIREBASE_STORAGE_BUCKET' && value) config.storageBucket = value;
          if (key === 'FIREBASE_MESSAGING_SENDER_ID' && value) config.messagingSenderId = value;
          if (key === 'FIREBASE_APP_ID' && value) config.appId = value;
          if (key === 'FIREBASE_MEASUREMENT_ID' && value) config.measurementId = value;
        }
      });
    } catch (err) {
      console.error('[Main] Failed to read .env file:', err);
    }
  }

  return config;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'ProTech ERP - Garage Management System',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false,
    autoHideMenuBar: true
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('app:get-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-firebase-config', () => {
  return getFirebaseEnvConfig();
});

ipcMain.handle('app:print', async () => {
  if (mainWindow) {
    mainWindow.webContents.print({ silent: false, printBackground: true });
    return { success: true };
  }
  return { success: false, error: 'Main window not available' };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

