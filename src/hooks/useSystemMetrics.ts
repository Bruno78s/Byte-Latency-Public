import { useState, useEffect } from 'react';

export interface SystemMetrics {
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

/**
 * Hook que coleta métricas reais do sistema operacional via Electron IPC
 */
export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0, temperature: 0, cores: 0 },
    memory: { total: 0, used: 0, free: 0, usagePercent: 0 },
    disk: { total: 0, used: 0, free: 0, usagePercent: 0 },
    processes: { all: 0, running: 0, blocked: 0 },
    network: { upload: 0, download: 0 },
    optimizationScore: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar se está no Electron
      const electronAPI = (window as any).electronAPI;
      
      if (!electronAPI || !electronAPI.getSystemMetrics) {
        // Se não estiver no Electron, usar valores simulados
        const cpu = Math.floor(Math.random() * 30) + 20;
        const memory = Math.floor(Math.random() * 40) + 40;
        const disk = Math.floor(Math.random() * 20) + 30;
        const processes = Math.floor(Math.random() * 100) + 150;

        let score = 100;
        const cpuScore = Math.max(0, 100 - cpu);
        score -= (100 - cpuScore) * 0.3;

        let memScore = 100;
        if (memory < 40) {
          memScore = 70 + (memory / 40) * 30;
        } else if (memory > 70) {
          memScore = Math.max(0, 100 - ((memory - 70) * 2));
        }
        score -= (100 - memScore) * 0.25;

        const diskScore = Math.max(0, 100 - disk);
        score -= (100 - diskScore) * 0.2;

        let processScore = 100;
        if (processes < 100) {
          processScore = 100;
        } else if (processes > 300) {
          processScore = Math.max(0, 100 - ((processes - 300) / 5));
        } else {
          processScore = 100 - ((processes - 100) / 200) * 50;
        }
        score -= (100 - processScore) * 0.25;

        const optimizationScore = Math.round(Math.max(0, Math.min(100, score)));

        setMetrics({
          cpu: { usage: cpu, temperature: 45, cores: 4 },
          memory: { total: 16000000000, used: (16000000000 * memory) / 100, free: (16000000000 * (100 - memory)) / 100, usagePercent: memory },
          disk: { total: 500000000000, used: (500000000000 * disk) / 100, free: (500000000000 * (100 - disk)) / 100, usagePercent: disk },
          processes: { all: processes, running: Math.floor(processes * 0.3), blocked: 0 },
          network: { upload: 0, download: 0 },
          optimizationScore
        });

        setIsLoading(false);
        return;
      }

      // Obter métricas reais via Electron IPC
      const data = await electronAPI.getSystemMetrics();
      
      if (data) {
        setMetrics(data);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Erro ao coletar métricas do sistema:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Coletar métricas imediatamente
    fetchMetrics();

    // Atualizar métricas a cada 15 segundos para não sobrecarregar
    const interval = setInterval(() => {
      fetchMetrics();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, isLoading, error, refreshMetrics: fetchMetrics };
};
