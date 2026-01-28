import { motion } from "framer-motion";
import { Minus, Square, X, Bell, User, LogOut, Crown, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";

export const Header = ({ activeTab, onTabChange }: { activeTab?: string; onTabChange?: (tab: string) => void }) => {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useClickOutside(() => setIsProfileMenuOpen(false));

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSettings = () => {
    if (onTabChange) {
      onTabChange("settings");
    }
    setIsProfileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-14 glass-card rounded-none border-b border-border/50 flex items-center justify-between px-4"
    >
      {/* App drag area (simulating window title bar) */}
      <div className="flex-1 h-full flex items-center">
        <span className="text-sm text-muted-foreground font-medium">
          Byte Latency - Sistema de Otimização v1.0
        </span>
        {isAdmin && (
          <span className="ml-3 px-2 py-0.5 rounded text-xs font-bold bg-warning/20 text-warning border border-warning/30 flex items-center gap-1">
            <Crown className="w-3 h-3" />
            ADMIN
          </span>
        )}
      </div>
      
      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Discord button removed */}

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>
        
        {/* User Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{profile?.username || "Usuário"}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-48 glass-card rounded-lg border border-border/50 py-2 z-50"
            >
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Configurações
              </button>
              <div className="h-px bg-border my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </motion.div>
          )}
        </div>
        
        <div className="w-px h-6 bg-border mx-2" />
        
        {/* Window controls */}
        <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Minus className="w-4 h-4 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Square className="w-3 h-3 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-lg hover:bg-destructive/20 transition-colors group">
          <X className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
        </button>
      </div>
    </motion.header>
  );
};
