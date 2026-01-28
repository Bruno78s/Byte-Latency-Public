// Preload precisa de require no estilo CommonJS mesmo em projetos ESM; usar createRequire para fazer a ponte
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Inicializando preload.js...');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  platform: process.platform,
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  setDiscordActivity: (activity) => ipcRenderer.send('set-discord-activity', activity),
  clearDiscordActivity: () => ipcRenderer.send('clear-discord-activity'),
  enableDiscordRPC: () => ipcRenderer.send('set-discord-activity', { details: 'Usando Byte Latency', state: 'Otimização', largeImageKey: 'icon', largeImageText: 'Byte Latency', startTimestamp: Date.now() }),
  disableDiscordRPC: () => ipcRenderer.send('clear-discord-activity'),
  executeCommand: (command, asAdmin) => ipcRenderer.invoke('execute-command', command, asAdmin),
  // Funções de download de recursos
  downloadFile: (options) => ipcRenderer.invoke('download-file', options),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  getAppPath: () => ipcRenderer.invoke('get-app-path')
});

contextBridge.exposeInMainWorld('electron', {
  executeCommand: (command, asAdmin) => ipcRenderer.invoke('execute-command', command, asAdmin),
  enableDiscordRPC: () => ipcRenderer.send('set-discord-activity', { details: 'Usando Byte Latency', state: 'Otimização', largeImageKey: 'icon', largeImageText: 'Byte Latency', startTimestamp: Date.now() }),
  disableDiscordRPC: () => ipcRenderer.send('clear-discord-activity')
});

console.log('[Preload] ✓ window.electron exposto com sucesso!');

