import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MemoryStick, 
  HardDrive, 
  Thermometer,
  Wifi,
  Clock,
  Zap,
  Shield,
  CheckCircle2,
  Key
} from "lucide-react";
import { CircularProgress } from "./CircularProgress";
import { StatCard } from "./StatCard";
import { OptimizeButton } from "./OptimizeButton";
import { PerformanceCharts } from "./PerformanceCharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Dashboard = () => {
  const { subscription, refreshProfile } = useAuth();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [stats, setStats] = useState({
    cpu: 45,
    ram: 68,
    disk: 52,
    temp: 62,
  });


  const isSubscriptionActive = subscription && new Date(subscription.expires_at) > new Date();

  const handleOptimize = () => {
    if (!isSubscriptionActive) {
      toast.error("Você precisa de uma licença ativa para usar esta função");
      return;
    }

    setIsOptimizing(true);
    setOptimizationComplete(false);
    
    const interval = setInterval(() => {
      setStats(prev => ({
        cpu: Math.max(15, prev.cpu - Math.random() * 10),
        ram: Math.max(25, prev.ram - Math.random() * 15),
        disk: Math.max(30, prev.disk - Math.random() * 8),
        temp: Math.max(45, prev.temp - Math.random() * 5),
      }));
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      setIsOptimizing(false);
      setOptimizationComplete(true);
      setStats({
        cpu: 18,
        ram: 32,
        disk: 38,
        temp: 48,
      });
    }, 3000);
  };



  const redeemKey = async () => {
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
        toast.error(error.message || "Erro ao resgatar key");
        return;
      }

      if (data && typeof data === 'object' && 'success' in data) {
        const result = data as { success: boolean; message: string };
        if (result.success) {
          toast.success(result.message || "Key ativada com sucesso!");
          setLicenseKey("");
          
          // Atualizar perfil do usuário imediatamente após ativação da licença
          await refreshProfile();
        } else {
          toast.error(result.message || "Key inválida");
        }
      } else {
        toast.error("Resposta inesperada do servidor");
      }
    } catch (error) {
      console.error("Unexpected error redeeming key:", error);
      toast.error("Erro ao processar requisição");
    } finally {
      setIsRedeeming(false);
    }
  };

  const getColorByValue = (value: number): "success" | "warning" | "destructive" => {
    if (value < 40) return "success";
    if (value < 70) return "warning";
    return "destructive";
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Painel de Controle
            </h2>
            <p className="text-muted-foreground mt-1">
              Monitore e otimize seu sistema em tempo real
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isSubscriptionActive ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/30">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm text-success font-medium">
                  Licença ativa até {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <Clock className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">
                  Sem licença ativa
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* License Key Activation (if no subscription) */}
        {!isSubscriptionActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 neon-border"
          >
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Ativar License Key
            </h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="flex-1 px-4 py-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none transition-colors font-mono"
                maxLength={19}
              />
              <button
                onClick={redeemKey}
                disabled={isRedeeming}
                className="px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isRedeeming ? "Ativando..." : "Ativar Key"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Gauges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 lg:col-span-2"
          >
            <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Performance do Sistema
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center">
                <CircularProgress 
                  value={Math.round(stats.cpu)} 
                  label="CPU"
                  sublabel="Processador"
                  color={getColorByValue(stats.cpu)}
                />
              </div>
              <div className="flex flex-col items-center">
                <CircularProgress 
                  value={Math.round(stats.ram)} 
                  label="RAM"
                  sublabel="Memória"
                  color={getColorByValue(stats.ram)}
                />
              </div>
              <div className="flex flex-col items-center">
                <CircularProgress 
                  value={Math.round(stats.disk)} 
                  label="DISCO"
                  sublabel="Armazenamento"
                  color={getColorByValue(stats.disk)}
                />
              </div>
              <div className="flex flex-col items-center">
                <CircularProgress 
                  value={Math.round(stats.temp)} 
                  label="TEMP"
                  sublabel="Temperatura"
                  color={getColorByValue(stats.temp)}
                />
              </div>
            </div>
          </motion.div>

          {/* Quick Optimize */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 flex flex-col items-center justify-center"
          >
            <AnimatePresence mode="wait">
              {optimizationComplete ? (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4 mx-auto glow-effect">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                  <h4 className="font-display font-bold text-lg text-success mb-2">
                    Otimizado!
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sistema funcionando perfeitamente
                  </p>
                  <button 
                    onClick={() => setOptimizationComplete(false)}
                    className="text-primary text-sm hover:underline"
                  >
                    Otimizar novamente
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <OptimizeButton isOptimizing={isOptimizing} onClick={handleOptimize} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Real-time Charts */}
        <PerformanceCharts />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={MemoryStick}
            label="RAM Livre"
            value="5.2 GB"
            sublabel="de 16 GB"
            trend="up"
            delay={0.1}
          />
          <StatCard
            icon={HardDrive}
            label="Espaço Livre"
            value="234 GB"
            sublabel="de 512 GB"
            trend="neutral"
            delay={0.2}
          />
          <StatCard
            icon={Thermometer}
            label="Temperatura"
            value={`${Math.round(stats.temp)}°C`}
            sublabel="Normal"
            trend="down"
            delay={0.3}
          />
          <StatCard
            icon={Wifi}
            label="Ping"
            value="24ms"
            sublabel="Baixo"
            trend="up"
            delay={0.4}
          />
        </div>



        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Informações do Sistema
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Sistema Operacional</p>
              <p className="font-medium">Windows 11 Pro</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Processador</p>
              <p className="font-medium">Intel Core i7-12700K</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Placa de Vídeo</p>
              <p className="font-medium">NVIDIA RTX 3080</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Memória RAM</p>
              <p className="font-medium">16 GB DDR5</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
