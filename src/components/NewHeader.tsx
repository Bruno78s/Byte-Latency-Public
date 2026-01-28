import { motion } from "framer-motion";
import { Globe, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

interface NewHeaderProps {
  optimizationLevel: number;
  onActivateClick?: () => void;
}

export const NewHeader = ({ optimizationLevel, onActivateClick }: NewHeaderProps) => {
  const { profile, subscription } = useAuth();
  const [showAbout, setShowAbout] = useState(false);

  const isSubscriptionActive = subscription && new Date(subscription.expires_at) > new Date();

  // Contador ao vivo do tempo restante
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!subscription?.expires_at) return null;
    const now = new Date();
    const expires = new Date(subscription.expires_at);
    let diff = Math.max(0, expires.getTime() - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    const seconds = Math.floor(diff / 1000);
    return { days, hours, minutes, seconds };
  });

  useEffect(() => {
    if (!subscription?.expires_at) return;
    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(subscription.expires_at);
      let diff = Math.max(0, expires.getTime() - now.getTime());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * (1000 * 60 * 60 * 24);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * (1000 * 60 * 60);
      const minutes = Math.floor(diff / (1000 * 60));
      diff -= minutes * (1000 * 60);
      const seconds = Math.floor(diff / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(interval);
  }, [subscription?.expires_at]);

  const getOptimizationStatus = () => {
    if (optimizationLevel >= 90) return { text: "Perfeito!", color: "text-green-400" };
    if (optimizationLevel >= 70) return { text: "Bom", color: "text-blue-400" };
    if (optimizationLevel >= 50) return { text: "Regular", color: "text-yellow-400" };
    return { text: "Crítico", color: "text-red-400" };
  };

  const handleDiscordClick = () => {
    window.open("https://discord.gg/93ftMpKXw9", "_blank");
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-20 bg-[#0a0e27] border-b border-[#1a1f3a] px-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-8">
          {/* User Greeting */}
          <div>
            <h1 className="text-2xl font-bold">
              Olá, <span className="text-blue-400">{profile?.username || "Usuário"}!</span>
            </h1>
            <p className="text-sm text-gray-400">Versão: <span className="text-blue-400">1.0</span></p>
          </div>

          {/* PRO Status */}
          <div className="px-6 py-3 rounded-2xl border-2 border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-sm font-bold text-purple-400">PRO</div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  {isSubscriptionActive ? (
                    <>
                      Ativo
                      {timeLeft && (
                        <span className="ml-2 text-purple-300 font-mono">
                          expira em: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                        </span>
                      )}
                    </>
                  ) : (
                    <>Não ativo</>
                  )}
                </div>
              </div>
              {!isSubscriptionActive && (
                <button 
                  onClick={onActivateClick}
                  className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
                >
                  Ativar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDiscordClick}
            className="w-10 h-10 rounded-xl bg-[#1a1f3a] hover:bg-[#252b4a] flex items-center justify-center transition-colors group"
            title="Junte-se ao nosso Discord"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515a.074.074 0 00-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 00-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.042-.106c-.663-.25-1.296-.551-1.904-.906a.077.077 0 00-.009-.128c.128-.096.256-.195.379-.298a.074.074 0 00.076-.01c3.995 1.87 8.317 1.87 12.267 0a.074.074 0 00.076.009c.123.103.251.202.379.298a.077.077 0 00-.007.128c-.608.355-1.24.656-1.904.906a.077.077 0 00-.041.107c.352.699.764 1.364 1.226 1.994a.076.076 0 00.084.028 19.963 19.963 0 006.002-3.03.077.077 0 00.032-.057c.5-4.565-.838-8.628-3.549-12.191a.06.06 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-.967-2.157-2.156c0-1.193.979-2.163 2.157-2.163c1.183 0 2.157.97 2.157 2.163c0 1.189-.979 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.967-2.157-2.156c0-1.193.979-2.163 2.157-2.163c1.188 0 2.162.97 2.162 2.163c0 1.189-.974 2.156-2.162 2.156z"/>
            </svg>
          </button>
          
          <button 
            onClick={() => setShowAbout(true)}
            className="px-4 py-2 rounded-xl bg-[#1a1f3a] hover:bg-[#252b4a] text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            Sobre o programa
          </button>

          <button className="px-4 py-2 rounded-xl bg-[#1a1f3a] hover:bg-[#252b4a] flex items-center gap-2 transition-colors">
            <Globe className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Português (Brasil)</span>
          </button>
        </div>
      </motion.header>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAbout(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a1f3a] max-w-2xl w-full rounded-2xl p-8 border border-blue-500/30"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Bem-vindo ao <span className="text-blue-400">Byte Latency</span>
            </h2>
            <div className="space-y-4 text-gray-300">
              <p className="text-lg">
                🚀 <strong className="text-white">Byte Latency</strong> é o otimizador de PC mais avançado do mercado, 
                desenvolvido para maximizar seu desempenho em jogos e aplicações.
              </p>
              <div className="space-y-2">
                <p>✨ <strong className="text-white">Principais recursos:</strong></p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  <li>Redução drástica de latência em jogos</li>
                  <li>Aumento de FPS em até 40%</li>
                  <li>Limpeza automática de processos desnecessários</li>
                  <li>Otimizações personalizadas para diferentes tipos de hardware</li>
                  <li>Desativação de serviços inúteis do Windows</li>
                </ul>
              </div>
              <p className="text-sm text-gray-400 mt-6">
                💡 Dica: Para obter os melhores resultados, execute uma formatação no computador antes de iniciar a otimização.
              </p>
              <p className="text-sm text-blue-400 mt-4">
                🎮 Junte-se à nossa comunidade no Discord para suporte, atualizações e dicas exclusivas!
              </p>
            </div>
            <button
              onClick={() => setShowAbout(false)}
              className="mt-6 w-full px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
            >
              Entendi!
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};
