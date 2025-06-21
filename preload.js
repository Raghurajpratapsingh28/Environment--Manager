const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getCurrentFolder: () => ipcRenderer.invoke('get-current-folder'),
  getFolders: () => ipcRenderer.invoke('get-folders'),
  createFolder: (folderName) => ipcRenderer.invoke('create-folder', folderName),
  deleteFolder: (folderName) => ipcRenderer.invoke('delete-folder', folderName),
  switchFolder: (folderName) => ipcRenderer.invoke('switch-folder', folderName),

  loadEnvVars: () => ipcRenderer.invoke('load-env-vars'),
  saveEnvVar: (key, value) => ipcRenderer.invoke('save-env-var', key, value),
  updateEnvVar: (oldKey, newKey, newValue) => ipcRenderer.invoke('update-env-var', oldKey, newKey, newValue),
  deleteEnvVar: (key) => ipcRenderer.invoke('delete-env-var', key),
  exportEnvVars: () => ipcRenderer.invoke('export-env-vars'),
  importEnvVars: () => ipcRenderer.invoke('import-env-vars')
});