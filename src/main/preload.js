const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getFirebaseConfig: () => ipcRenderer.invoke('get-firebase-config'),
  printDocument: () => ipcRenderer.invoke('app:print'),
  platform: process.platform
});

