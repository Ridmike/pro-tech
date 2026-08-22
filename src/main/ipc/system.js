/**
 * IPC System Handlers Module
 * Handles desktop native capabilities (printing, file dialogs, system info)
 */
const { ipcMain, app } = require('electron');

function registerIpcHandlers() {
  ipcMain.handle('system:get-info', () => {
    return {
      appName: app.getName(),
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      platform: process.platform
    };
  });
}

module.exports = { registerIpcHandlers };
