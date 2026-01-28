import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface OptimizeButtonProps {
  isOptimizing: boolean;
  onClick: () => void;
}

export const OptimizeButton = ({ isOptimizing, onClick }: OptimizeButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={isOptimizing}
      className="relative group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Outer glow ring */}
      <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-xl group-hover:bg-primary/30 transition-colors" />
      
      {/* Animated border */}
      <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background: "conic-gradient(from 0deg, hsl(175 80% 50%) 0%, transparent 60%, hsl(175 80% 50%) 100%)",
          }}
          animate={isOptimizing ? { rotate: 360 } : { rotate: 0 }}
          transition={isOptimizing ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
        />
      </div>
      
      {/* Button content */}
      <div className="relative glass-card px-12 py-6 flex items-center gap-4 overflow-hidden">
        {/* Scan line effect */}
        {isOptimizing && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent"
            animate={{ y: ["100%", "-100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        <motion.div
          animate={isOptimizing ? { rotate: 360 } : { rotate: 0 }}
          transition={isOptimizing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          <Zap className="w-8 h-8 text-primary" fill="currentColor" />
        </motion.div>
        
        <div className="text-left">
          <p className="font-display font-bold text-xl text-foreground">
            {isOptimizing ? "OTIMIZANDO..." : "OTIMIZAR AGORA"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isOptimizing ? "Aguarde..." : "Clique para otimizar o sistema"}
          </p>
        </div>
      </div>
    </motion.button>
  );
};
