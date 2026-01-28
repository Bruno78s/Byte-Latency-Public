import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Cpu, MemoryStick, Thermometer, Activity } from "lucide-react";

interface DataPoint {
  time: string;
  cpu: number;
  ram: number;
  temp: number;
}

export const PerformanceCharts = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentStats, setCurrentStats] = useState({ cpu: 45, ram: 62, temp: 55 });

  useEffect(() => {
    // Inicializar com alguns dados
    const initialData: DataPoint[] = [];
    for (let i = 0; i < 20; i++) {
      const time = new Date(Date.now() - (20 - i) * 3000);
      initialData.push({
        time: time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        cpu: Math.random() * 40 + 30,
        ram: Math.random() * 30 + 50,
        temp: Math.random() * 15 + 50,
      });
    }
    setData(initialData);

    // Atualizar a cada 3 segundos
    const interval = setInterval(() => {
      const now = new Date();
      const newStats = {
        cpu: Math.max(10, Math.min(90, currentStats.cpu + (Math.random() - 0.5) * 20)),
        ram: Math.max(30, Math.min(85, currentStats.ram + (Math.random() - 0.5) * 10)),
        temp: Math.max(40, Math.min(80, currentStats.temp + (Math.random() - 0.5) * 8)),
      };
      
      setCurrentStats(newStats);
      
      setData(prev => {
        const newData = [...prev.slice(1), {
          time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          cpu: newStats.cpu,
          ram: newStats.ram,
          temp: newStats.temp,
        }];
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-primary/30">
          <p className="text-xs text-muted-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Monitoramento em Tempo Real
        </h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">CPU: {currentStats.cpu.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">RAM: {currentStats.ram.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Temp: {currentStats.temp.toFixed(0)}°C</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(175, 80%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(175, 80%, 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(215, 20%, 55%)"
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)"
              tick={{ fontSize: 10 }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cpu"
              name="CPU"
              stroke="hsl(175, 80%, 50%)"
              strokeWidth={2}
              fill="url(#cpuGradient)"
            />
            <Area
              type="monotone"
              dataKey="ram"
              name="RAM"
              stroke="hsl(142, 76%, 45%)"
              strokeWidth={2}
              fill="url(#ramGradient)"
            />
            <Area
              type="monotone"
              dataKey="temp"
              name="Temp"
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              fill="url(#tempGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* System Info Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Processador</span>
          </div>
          <p className="text-2xl font-display font-bold text-primary">
            {currentStats.cpu.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Intel Core i7-12700K</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">Memória RAM</span>
          </div>
          <p className="text-2xl font-display font-bold text-success">
            {currentStats.ram.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {((16 * currentStats.ram) / 100).toFixed(1)} GB / 16 GB
          </p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Temperatura</span>
          </div>
          <p className="text-2xl font-display font-bold text-warning">
            {currentStats.temp.toFixed(0)}°C
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {currentStats.temp < 60 ? "Normal" : currentStats.temp < 75 ? "Elevado" : "Alto"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
