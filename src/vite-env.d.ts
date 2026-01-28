/// <reference types="vite/client" />

interface ElectronAPI {
  close: () => void;
  minimize: () => void;
  maximize: () => void;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
