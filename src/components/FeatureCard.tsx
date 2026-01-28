import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isActive?: boolean;
  onClick?: () => void;
  delay?: number;
}

export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  isActive = false, 
  onClick,
  delay = 0 
}: FeatureCardProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      onClick={onClick}
      className={`
        glass-card p-5 text-left w-full group transition-all duration-300
        ${isActive 
          ? "border-primary/50 glow-effect" 
          : "hover:border-primary/30"
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          p-3 rounded-xl transition-all duration-300
          ${isActive 
            ? "bg-primary text-primary-foreground" 
            : "bg-primary/10 text-primary group-hover:bg-primary/20"
          }
        `}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground mb-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        
        <div className={`
          w-3 h-3 rounded-full transition-all duration-300
          ${isActive 
            ? "bg-success glow-effect" 
            : "bg-muted"
          }
        `} />
      </div>
    </motion.button>
  );
};
