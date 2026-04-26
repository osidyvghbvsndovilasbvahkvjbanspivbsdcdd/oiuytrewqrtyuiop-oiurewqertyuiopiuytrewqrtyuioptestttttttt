const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectTemplateImage: () => ipcRenderer.invoke('select-template-image'),
  savePDF: (data) => ipcRenderer.invoke('save-pdf', data),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});
