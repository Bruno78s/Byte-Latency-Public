import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export const StatCard = ({ icon: Icon, label, value, sublabel, trend, delay = 0 }: StatCardProps) => {
  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-4 group hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trendColors[trend]}`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
      
      <div className="mt-3">
        <p className="text-2xl font-display font-bold text-foreground">
          {value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{sublabel}</p>
        )}
      </div>
    </motion.div>
  );
};
