export {};

interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  processes: {
    all: number;
    running: number;
    blocked: number;
  };
  network: {
    upload: number;
    download: number;
  };
  optimizationScore: number;
}

interface DiscordActivity {
  state?: string;
  details?: string;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  startTimestamp?: number;
}

// Tipos para eventos de update do electron-updater
interface ElectronAPI {
    enableDiscordRPC?: () => void;
    disableDiscordRPC?: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  platform: string;
  getSystemMetrics: () => Promise<any>;
  setDiscordActivity?: (activity: any) => void;
  clearDiscordActivity?: () => void;
  executeCommand: (command: string, asAdmin: boolean) => Promise<any>;
  // Eventos de update
  onUpdateAvailable?: (cb: () => void) => void;
  onUpdateDownloaded?: (cb: () => void) => void;
  onUpdateError?: (cb: (msg: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electron?: ElectronAPI;
  }
}
