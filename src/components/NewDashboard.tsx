import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Trophy, Cpu, MonitorPlay, MemoryStick, Sparkles, Key, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SystemMetrics } from "@/hooks/useSystemMetrics";
import { useDiscordPresence } from "@/hooks/useDiscordPresence";
import { useSettings } from "@/hooks/useSettings";
import { NewsSection } from "./NewsSection";
import { OptimizationResourceManager } from "@/lib/optimizationResourceManager";
import { OPTIMIZATION_RESOURCES } from "@/lib/optimizationResources";

interface SystemInfo {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  processCount?: number;
}

interface NewDashboardProps {
  systemMetrics?: SystemMetrics;
}

export const NewDashboard = ({ systemMetrics }: NewDashboardProps) => {
  const { subscription } = useAuth();
  const { settings } = useSettings();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    processCount: 0,
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const isSubscriptionActive = subscription && new Date(subscription.expires_at) > new Date();
  
  // Discord Rich Presence
  useDiscordPresence({
    state: isSubscriptionActive ? "PRO Ativo" : "Versão Free",
    details: isOptimizing ? "Otimizando sistema..." : "No Dashboard",
    largeImageKey: "bytelatency_logo",
    largeImageText: "Byte Latency - PC Optimizer",
    enabled: settings.discordRichPresence
  });

  // Inicializar recursos de otimização na primeira execução
  useEffect(() => {
    OptimizationResourceManager.initialize().catch(error => {
      console.error('Erro ao inicializar recursos:', error);
    });
  }, []);

  // Obter contagem real de usuários
  useEffect(() => {
    const getUserCount = async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setUserCount(count);
      }
    };
    getUserCount();
  }, []);

  // Buscar métricas em tempo real do Electron
  useEffect(() => {
    const fetchRealTimeMetrics = async () => {
      try {
        const electronAPI = (window as any).electronAPI;
        
        if (electronAPI && electronAPI.getSystemMetrics) {
          const metrics = await electronAPI.getSystemMetrics();
          
          if (metrics) {
            setSystemInfo({
              cpuUsage: Math.round(metrics.cpu.usage),
              memoryUsage: Math.round(metrics.memory.usagePercent),
              diskUsage: Math.round(metrics.disk.usagePercent),
              processCount: metrics.processes.all,
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
      }
    };

    // Buscar imediatamente
    fetchRealTimeMetrics();

    // Atualizar a cada 10 segundos para melhor acompanhamento em tempo real
    const interval = setInterval(fetchRealTimeMetrics, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleOptimize = useCallback(async () => {
    if (!isSubscriptionActive) {
      toast.error("Você precisa de uma licença PRO ativa para otimizar");
      setShowKeyInput(true);
      return;
    }

    // Verificar se está rodando no Electron
    const electronAPI = (window as any).electron || (window as any).electronAPI;
    if (!electronAPI || !electronAPI.executeCommand) {
      toast.error("⚠️ As otimizações só funcionam no aplicativo desktop (.exe). Baixe o instalador!");
      console.error("window.electron não disponível:", { electron: electronAPI });
      return;
    }

    setIsOptimizing(true);
    toast.info("Iniciando otimização do sistema...");
    
    try {
      let completed = 0;
      const total = OPTIMIZATION_RESOURCES.length;

      for (const resource of OPTIMIZATION_RESOURCES) {
        try {
          toast.info(`Aplicando: ${resource.name}...`);
          
          // Garantir que o recurso está disponível (baixa se necessário)
          const localPath = await OptimizationResourceManager.ensureResource(resource.path);
          
          if (!localPath) {
            console.warn(`Recurso não disponível: ${resource.name}, pulando...`);
            continue;
          }
          
          if (resource.type === 'reg') {
            // Executar arquivo .reg com regedit
            await electronAPI.executeCommand(`regedit /s "${localPath}"`, true);
          } else if (resource.type === 'bat') {
            // Executar arquivo .bat diretamente
            await electronAPI.executeCommand(`"${localPath}"`, true);
          }
          
          completed++;
          const progress = (completed / total) * 100;
          
          // Mostrar progresso no toast
          if (completed % 3 === 0) {
            toast.info(`Progresso: ${Math.floor(progress)}%`);
          }
          
        } catch (error) {
          console.error(`Erro ao executar ${resource.name}:`, error);
          // Continuar mesmo com erros
        }
      }

      // Recalcular métricas após otimização
      if (electronAPI && electronAPI.getSystemMetrics) {
        const metrics = await electronAPI.getSystemMetrics();
        if (metrics) {
          setSystemInfo({
            cpuUsage: Math.round(metrics.cpu.usage),
            memoryUsage: Math.round(metrics.memory.usagePercent),
            diskUsage: Math.round(metrics.disk.usagePercent),
            processCount: metrics.processes.all,
          });
        }
      }
      
      toast.success("✨ Otimização concluída! Sistema otimizado com sucesso.");
      
    } catch (error) {
      console.error("Erro durante otimização:", error);
      toast.error("Erro ao executar otimizações. Execute como Administrador.");
    } finally {
      setIsOptimizing(false);
    }
  }, [isSubscriptionActive]);

  const redeemKey = useCallback(async () => {
    if (!licenseKey.trim()) {
      toast.error("Digite uma key válida");
      return;
    }

    setIsRedeeming(true);

    try {
      const { data, error } = await supabase
        .rpc("redeem_license_key", { p_key: licenseKey.toUpperCase() });

      if (error) {
        console.error("Redeem error:", error);
        toast.error(error.message || "Erro ao ativar licença");
        return;
      }

      if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; message: string };
        if (result.success) {
          toast.success("✅ Licença ativada com sucesso! Bem-vindo ao PRO!");
          setShowKeyInput(false);
          setLicenseKey("");
          
          // Aguardar 1 segundo para garantir que o DB foi atualizado
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          toast.error(result.message || "Key inválida ou já utilizada");
        }
      } else {
        toast.error("Resposta inesperada do servidor");
      }
    } catch (error: any) {
      console.error("Redeem error:", error);
      toast.error("Erro ao ativar licença");
    } finally {
      setIsRedeeming(false);
    }
  }, [licenseKey]);

  // Memoizar cálculos de status
  const processStatus = useMemo(() => {
    const count = systemInfo.processCount || 0;
    if (count < 80) return { color: "text-green-400", label: "Ótimo", sublabel: "Baixa carga" };
    if (count < 150) return { color: "text-yellow-400", label: "Normal", sublabel: "Uso moderado" };
    if (count < 250) return { color: "text-red-400", label: "Alto", sublabel: "Muitos processos" };
    return { color: "text-red-400", label: "Crítico", sublabel: "Muitos processos" };
  }, [systemInfo.processCount]);

  return (
    <div className="flex-1 bg-[#0a0e27] min-h-0 flex flex-col">
      <div className="p-3 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-3">
            {/* User Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1228] rounded-2xl p-4 border border-blue-500/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total de</div>
                  <div className="text-3xl font-bold text-white">
                    {userCount.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-gray-400">Usuários</div>
                </div>
              </div>
            </motion.div>

            {/* Process Count Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1228] rounded-2xl p-4 border border-purple-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Processos</div>
                    <div className="text-3xl font-bold text-white">
                      {systemInfo.processCount || 0}
                    </div>
                    <div className="text-sm text-gray-400">em execução</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${processStatus.color}`}>
                    {processStatus.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {processStatus.sublabel}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Optimization Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-8 h-8 text-white" />
                  <h2 className="text-4xl font-bold text-white">
                    BYTE<span className="text-blue-200">LATENCY</span>
                  </h2>
                </div>
                
                <p className="text-white/90 text-lg mb-6 max-w-md">
                  Byte Latency aumenta o FPS em todos os jogos e reduz a latência do sistema ao mínimo possível!
                </p>

                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
                >
                  {isOptimizing ? (
                    <>
                      <div className="w-5 h-5 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                      Otimizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Começar otimização
                    </>
                  )}
                </button>

                <p className="mt-4 text-sm text-white/80 bg-white/10 border border-white/20 rounded-xl px-4 py-3 backdrop-blur">
                  ⚠️ Para um ganho máximo de desempenho, recomendamos formatar o computador antes de iniciar a otimização.
                </p>
              </div>

              {/* Decorative Arrow */}
              <div className="absolute bottom-0 right-8 opacity-20">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                  <path d="M20 180L180 20M180 20L120 20M180 20L180 80" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Coluna Direita: PRO + Notícias */}
          <div className="flex flex-col gap-3">
            {/* Card de ativação PRO */}
            {!isSubscriptionActive && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-4 border border-purple-500/30 mb-2 w-full max-w-xs self-center"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Key className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">Ative o PRO</h3>
                </div>
                <p className="text-xs text-gray-300 mb-3">
                  Desbloqueie todo o potencial do Byte Latency com recursos PRO exclusivos.
                </p>
                {!showKeyInput ? (
                  <button
                    data-show-key-input
                    onClick={() => setShowKeyInput(true)}
                    className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors text-sm"
                  >
                    Inserir Key
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="w-full px-3 py-1.5 bg-[#0a0e27] border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                    />
                    <button
                      onClick={redeemKey}
                      disabled={isRedeeming}
                      className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 text-sm"
                    >
                      {isRedeeming ? "Ativando..." : "Ativar Licença"}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            {/* Card de Notícias fixo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20 w-full max-w-xs self-center"
            >
              <h3 className="text-xl font-bold text-white mb-4">Notícias:</h3>
              <div className="space-y-4">
                <div className="group cursor-pointer">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs text-gray-400">14.01.2026</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-blue-400">Byte Latency</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 font-semibold">
                      LANÇAMENTO
                    </span>
                  </div>
                  <h4 className="font-sans text-sm font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                    Byte Latency v1.0 já disponível!
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    Nosso otimizador revolucionário de PC está agora disponível. Maximize seu FPS e reduza latência em todos os jogos!
                  </p>
                </div>
                <div className="h-px bg-blue-500/10 my-4" />
                <div className="group cursor-pointer">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs text-gray-400">14.01.2026</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-blue-400">Update</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 font-semibold">
                      INFO
                    </span>
                  </div>
                  <h4 className="font-sans text-sm font-semibold text-white group-hover:text-blue-400 transition-colors mb-1">
                    Comunidade Discord disponível
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    Junte-se à nossa comunidade no Discord para suporte, dicas exclusivas e atualizações em primeira mão.
                  </p>
                </div>
              </div>
            </motion.div>
            {/* NewsSection dinâmica */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full max-w-xs self-center"
            >
              <NewsSection />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
