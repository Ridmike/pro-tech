const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Parse .env file securely
function getFirebaseEnvConfig() {
  const envPath = path.join(__dirname, '../../.env');
  const config = {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  };

  if (fs.existsSync(envPath)) {
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

          if (key === 'FIREBASE_API_KEY') config.apiKey = value;
          if (key === 'FIREBASE_AUTH_DOMAIN') config.authDomain = value;
          if (key === 'FIREBASE_PROJECT_ID') config.projectId = value;
          if (key === 'FIREBASE_STORAGE_BUCKET') config.storageBucket = value;
          if (key === 'FIREBASE_MESSAGING_SENDER_ID') config.messagingSenderId = value;
          if (key === 'FIREBASE_APP_ID') config.appId = value;
          if (key === 'FIREBASE_MEASUREMENT_ID') config.measurementId = value;
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

