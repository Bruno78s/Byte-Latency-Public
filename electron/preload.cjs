// Script de preload (CommonJS) para expor APIs seguras
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Inicializando preload.cjs...');


contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  platform: process.platform,
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  setDiscordActivity: (activity) => ipcRenderer.send('set-discord-activity', activity),
  clearDiscordActivity: () => ipcRenderer.send('clear-discord-activity'),
  executeCommand: (command, asAdmin) => ipcRenderer.invoke('execute-command', command, asAdmin),
  // Eventos de update
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', cb),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
  onUpdateError: (cb) => ipcRenderer.on('update-error', (event, msg) => cb(msg)),
});

contextBridge.exposeInMainWorld('electron', {
  executeCommand: (command, asAdmin) => ipcRenderer.invoke('execute-command', command, asAdmin),
});

console.log('[Preload] ✓ window.electron e electronAPI expostos');
