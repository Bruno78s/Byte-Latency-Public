import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NewSidebar } from "@/components/NewSidebar";
import { NewHeader } from "@/components/NewHeader";
import { NewDashboard } from "@/components/NewDashboard";
import { AdminPanelComplete } from "@/components/AdminPanelComplete";
import { Settings } from "@/components/Settings";
import { useAuth } from "@/contexts/AuthContext";
import { useLicenseTracker } from "@/hooks/useLicenseTracker";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { motion } from "framer-motion";
import { User } from "lucide-react";

const Index = () => {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { metrics } = useSystemMetrics();
  const optimizationLevel = metrics.optimizationScore;
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Rastrear uso da licença
  useLicenseTracker();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Animar progresso de carregamento
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return 90;
          return Math.min(prev + Math.random() * 10, 90);
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      // Quando o carregamento terminar, completar a barra de progresso
      const completeProgress = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(completeProgress);
            return 100;
          }
          return Math.min(prev + 10, 100);
        });
      }, 50);
      return () => clearInterval(completeProgress);
    }
  }, [isLoading]);

  // Mostrar tela de carregamento apenas enquanto estiver carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="text-center relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <div className="inline-flex items-center justify-center mb-6">
              <img src="./Latency.png" alt="Latency Logo" className="h-20 w-auto drop-shadow-lg" />
            </div>
            <h1 className="font-bold text-4xl text-white mb-2">
              BYTE <span className="text-blue-400">LATENCY</span>
            </h1>
            <p className="text-sm text-gray-400 tracking-widest">PERFORMANCE OPTIMIZER</p>
          </motion.div>

          {/* User Info */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex flex-col items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-lg shadow-blue-500/30">
                <div className="w-full h-full rounded-full bg-[#1a1f3a] flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.username || "User"} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-blue-400" />
                  )}
                </div>
              </div>
              
              {/* Username */}
              <div>
                <p className="text-gray-400 text-sm mb-1">Bem-vindo de volta</p>
                <p className="text-white text-xl font-semibold">
                  {profile?.username || user.email?.split('@')[0] || "Usuário"}
                </p>
              </div>
            </motion.div>
          )}

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-80 mx-auto"
          >
            <div className="mb-3 flex justify-between items-center">
              <span className="text-sm text-gray-400">Carregando...</span>
              <span className="text-sm font-semibold text-blue-400">{Math.round(loadingProgress)}%</span>
            </div>
            
            <div className="h-2 bg-[#1a1f3a] rounded-full overflow-hidden border border-blue-500/20">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50"
                initial={{ width: "0%" }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>

            {/* Loading Steps */}
            <div className="mt-4 text-xs text-gray-500">
              {loadingProgress < 30 && "Conectando ao servidor..."}
              {loadingProgress >= 30 && loadingProgress < 60 && "Carregando perfil..."}
              {loadingProgress >= 60 && loadingProgress < 90 && "Verificando licença..."}
              {loadingProgress >= 90 && "Quase pronto..."}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    // Painel admin - usar AdminPanelComplete diretamente
    if (activeTab.startsWith("admin") && isAdmin) {
      return <AdminPanelComplete activeSubTab={activeTab} />;
    }

    switch (activeTab) {
      case "settings":
        return <Settings />;
      case "dashboard":
      case "home":
      default:
        return <NewDashboard systemMetrics={metrics} />;
    }
  };

  const handleActivateClick = () => {
    // Rolar para o dashboard e mostrar input de chave
    setActiveTab("dashboard");
    // Pequeno delay para garantir que o componente foi montado
    setTimeout(() => {
      const dashboardElement = document.querySelector('[data-show-key-input]');
      if (dashboardElement) {
        (dashboardElement as HTMLButtonElement).click();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] flex overflow-hidden">
      {/* Sidebar */}
      <NewSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        optimizationLevel={optimizationLevel}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <NewHeader 
          optimizationLevel={optimizationLevel}
          onActivateClick={handleActivateClick}
        />
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
