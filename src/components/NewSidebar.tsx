import { motion } from "framer-motion";
import { 
  Home,
  User,
  X,
  Cloud,
  History,
  Settings as SettingsIcon,
  Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface NewSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  optimizationLevel: number;
}

export const NewSidebar = ({ activeTab, onTabChange, optimizationLevel }: NewSidebarProps) => {
  const { signOut, profile, isAdmin } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleCloseApp = () => {
    if (window.confirm("Deseja realmente fechar o ByteLatency?")) {
      // Se estiver no Electron
      const windowWithElectron = window as unknown as { electron?: { close: () => void } };
      if (windowWithElectron.electron?.close) {
        windowWithElectron.electron.close();
      } else {
        // Se estiver no navegador
        window.close();
        // Se window.close() não funcionar (bloqueado pelo navegador)
        toast.info("Feche a aba do navegador para sair");
      }
    }
  };

  const handleCloudSync = async () => {
    toast.loading("Sincronizando dados...");
    
    try {
      // Buscar dados atualizados do usuário
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Forçar refresh dos dados
      const [profileRes, subRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_subscriptions").select("*").eq("user_id", user.id).maybeSingle()
      ]);

      if (profileRes.error) throw profileRes.error;

      toast.success("Dados sincronizados com sucesso!");
      
      // Recarregar a página para aplicar mudanças
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Erro ao sincronizar dados");
    }
  };

  const handleHistory = () => {
    onTabChange("history");
    toast.info("Histórico de otimizações em breve!");
  };

  const handleApps = () => {
    onTabChange("apps");
    toast.info("Gerenciador de apps em breve!");
  };

  const handleProfile = () => {
    onTabChange("settings");
  };

  const handleMenuClick = (itemId: string) => {
    switch (itemId) {
      case "dashboard":
        onTabChange("dashboard");
        break;
      case "profile":
        handleProfile();
        break;
      case "apps":
        handleApps();
        break;
      case "close":
        handleCloseApp();
        break;
      case "cloud":
        handleCloudSync();
        break;
      case "history":
        handleHistory();
        break;
      default:
        onTabChange(itemId);
    }
  };

  const menuItems = [
    { id: "dashboard", icon: Home, tooltip: "Dashboard" },
    { id: "profile", icon: User, tooltip: "Perfil" },
    ...(isAdmin ? [{ id: "admin", icon: Shield, tooltip: "Admin" }] : []),
    { id: "close", icon: X, tooltip: "Fechar" },
  ];

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-20 h-screen bg-[#0a0e27] border-r border-[#1a1f3a] flex flex-col items-center py-6 relative"
    >
      {/* Logo / Avatar */}
      <div className="mb-8 relative group">
        <motion.button
          onClick={() => onTabChange("settings")}
          className="w-12 h-12 rounded-xl overflow-hidden border-2 border-blue-500/30 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/50"
          title="Ir para Configurações"
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile?.username || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {profile?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          )}
        </motion.button>
        
        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-[#1a1f3a] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border border-blue-500/20">
            {profile?.username || "Perfil"}
          </div>
        </div>
      </div>
      
      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col items-center gap-6">
        {menuItems.map((item, index) => (
          <div key={item.id} className="relative group">
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleMenuClick(item.id)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                ${activeTab === item.id 
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50" 
                  : "text-gray-400 hover:text-white hover:bg-[#1a1f3a]"
                }
              `}
            >
              <item.icon className="w-6 h-6" />
            </motion.button>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-[#1a1f3a] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap border border-blue-500/20">
                {item.tooltip}
              </div>
            </div>
          </div>
        ))}
      </nav>

      {/* Optimization Circle */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 -mb-2">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="#1a1f3a"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="url(#gradient)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - optimizationLevel / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{optimizationLevel}%</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
