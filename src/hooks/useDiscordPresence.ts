import { useEffect } from 'react';

interface DiscordPresenceOptions {
  state?: string;
  details?: string;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  startTimestamp?: number;
  enabled?: boolean;
}

export const useDiscordPresence = (options: DiscordPresenceOptions) => {
  useEffect(() => {
    // Executar apenas no Electron
    if (!window.electronAPI?.setDiscordActivity) {
      return;
    }

    // Verificar se Discord Rich Presence está ativado
    if (options.enabled === false) {
      // Limpar atividade se desativado
      try {
        window.electronAPI?.clearDiscordActivity?.();
      } catch (error) {
        console.error('[Discord] Failed to clear presence:', error);
      }
      return;
    }

    // Definir Discord Rich Presence
    try {
      window.electronAPI.setDiscordActivity({
        state: options.state || 'Navegando',
        details: options.details || 'ByteLatency - PC Optimizer',
        largeImageKey: options.largeImageKey || 'bytelatency_logo',
        largeImageText: options.largeImageText || 'ByteLatency',
        smallImageKey: options.smallImageKey,
        smallImageText: options.smallImageText,
        startTimestamp: options.startTimestamp || Date.now(),
      });
    } catch (error) {
      console.error('[Discord] Failed to set presence:', error);
    }

    // Limpeza ao desmontar
    return () => {
      try {
        window.electronAPI?.clearDiscordActivity?.();
      } catch (error) {
        console.error('[Discord] Failed to clear presence:', error);
      }
    };
  }, [options.state, options.details, options.largeImageKey, options.largeImageText, options.smallImageKey, options.smallImageText, options.startTimestamp, options.enabled]);
};
