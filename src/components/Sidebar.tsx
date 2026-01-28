import { motion } from "framer-motion";
import { 
  Gauge, 
  Gamepad2, 
  Crown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { isAdmin } = useAuth();

  const menuItems = [
    { id: "dashboard", icon: Gauge, label: "Dashboard" },
  ];

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-56 h-screen glass-card rounded-none border-r border-border/50 flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl gradient-primary">
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground neon-text">
              Latency
            </h1>
            <p className="text-[10px] text-muted-foreground tracking-widest">PC OPTIMIZER</p>
          </div>
        </div>
      </div>
      
      {/* Navigation - centered vertical list */}
      <nav className="flex-1 p-3 flex flex-col items-center justify-start gap-3 mt-3">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => onTabChange(item.id)}
            className={`w-44 mx-auto flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all duration-300 text-center
              ${activeTab === item.id 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }
            `}
          >
            <item.icon className="w-6 h-6" />
            <span className="font-medium text-sm">{item.label}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="activeTab"
                className="mt-2 w-2 h-2 rounded-full bg-primary"
                style={{ boxShadow: "0 0 6px hsl(175 80% 50%)" }}
              />
            )}
          </motion.button>
        ))}

        {/* Admin Menu Item */}
        {isAdmin && (
          <>
            <div className="h-px bg-border my-4" />
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              onClick={() => onTabChange("admin")}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${activeTab === "admin" 
                  ? "bg-warning/20 text-warning border border-warning/30" 
                  : "text-warning/70 hover:text-warning hover:bg-warning/10"
                }
              `}
            >
              <Crown className="w-5 h-5" />
              <span className="font-medium">Admin</span>
              {activeTab === "admin" && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto w-2 h-2 rounded-full bg-warning"
                  style={{ boxShadow: "0 0 10px hsl(38 92% 50%)" }}
                />
              )}
            </motion.button>
          </>
        )}
      </nav>
      
      {/* Bottom area: Admin (if allowed) */}
      <div className="p-4 border-t border-border/50">
        {isAdmin && (
          <div className="glass-card p-3 rounded-xl">
            <div className="text-xs text-muted-foreground mb-2">Administração</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onTabChange('admin-generate')}
                className="w-full text-sm px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                Gerar Key
              </button>
              <button
                onClick={() => onTabChange('admin-keys')}
                className="w-full text-sm px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                Gerenciar Keys
              </button>
              <button
                onClick={() => onTabChange('admin-users')}
                className="w-full text-sm px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                Usuários
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
