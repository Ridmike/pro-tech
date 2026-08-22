const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  printDocument: () => ipcRenderer.invoke('app:print'),
  platform: process.platform
});
