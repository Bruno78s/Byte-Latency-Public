import { useState, useEffect } from "react";
import { Bell, Calendar, X, Clock, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  created_by: string;
  expires_at?: string;
}

export const NewsSection = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
    loadNotifications();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAdmin = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        // Filtrar notificações expiradas
        const activeNotifications = (data as unknown as Notification[]).filter(n => {
          if (!n.expires_at) return true;
          return new Date(n.expires_at) > new Date();
        });
        setNotifications(activeNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success('Notícia deletada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao deletar notícia');
    } finally {
      setDeletingId(null);
    }
  };

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d restante${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours}h restante${hours > 1 ? 's' : ''}`;
    
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m restante${minutes > 1 ? 's' : ''}`;
  };

  const getNotificationType = (title: string) => {
    if (title.toLowerCase().includes('lançamento') || title.toLowerCase().includes('disponível')) {
      return { 
        label: 'LANÇAMENTO', 
        emoji: '🚀',
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        bgGradient: 'from-emerald-500/5 to-blue-500/5'
      };
    }
    if (title.toLowerCase().includes('update') || title.toLowerCase().includes('atualização')) {
      return { 
        label: 'INFO', 
        emoji: 'ℹ️',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        bgGradient: 'from-blue-500/5 to-cyan-500/5'
      };
    }
    if (title.toLowerCase().includes('discord') || title.toLowerCase().includes('comunidade')) {
      return { 
        label: 'INFO', 
        emoji: '💬',
        color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        bgGradient: 'from-indigo-500/5 to-blue-500/5'
      };
    }
    return { 
      label: 'AVISO', 
      emoji: '⚠️',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      bgGradient: 'from-amber-500/5 to-orange-500/5'
    };
  };

  if (isLoading) {
    return (
      <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Notícias</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-[#0a0e27] rounded-xl p-5 border border-blue-500/10">
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Notícias</h2>
        </div>
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 font-medium">Nenhuma notícia disponível</p>
          <p className="text-gray-500 text-sm mt-2">Volte em breve para atualizações</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1f3a] via-[#151a32] to-[#0f1428] rounded-2xl p-6 border border-blue-500/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
          <Bell className="w-5 h-5 text-blue-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Notícias</h2>
          <p className="text-xs text-gray-400 mt-0.5">{notifications.length} notícia{notifications.length > 1 ? 's' : ''} ativa{notifications.length > 1 ? 's' : ''}</p>
        </div>
      </div>
      
      <div className="space-y-2.5">
        {notifications.map((notification, index) => {
          const type = getNotificationType(notification.title);
          const timeRemaining = getTimeRemaining(notification.expires_at);
          const isExpired = timeRemaining === 'Expirado';
          const isExpanded = expandedId === notification.id;
          const shouldShowMore = notification.message.length > 150;
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative bg-gradient-to-r ${type.bgGradient} rounded-xl p-5 border transition-all group cursor-default ${
                isExpired 
                  ? 'border-gray-600/30 opacity-50' 
                  : 'border-blue-500/20 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-[1.02]'
              }`}
            >
              {/* Top separator */}
              {index > 0 && <div className="absolute -top-1.5 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>}
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap flex items-center gap-1.5 ${type.color}`}>
                      <span className="text-sm">{type.emoji}</span>
                      {type.label}
                    </span>
                    {timeRemaining && (
                      <span className={`text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
                        isExpired ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        {timeRemaining}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 break-words group-hover:text-blue-200 transition-colors leading-snug">
                    {notification.title}
                  </h3>
                  
                  <p className={`text-base text-gray-200 leading-relaxed break-words font-normal transition-all ${
                    isExpanded ? '' : 'line-clamp-3'
                  }`}>
                    {notification.message}
                  </p>
                  
                  {shouldShowMore && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : notification.id)}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium"
                    >
                      {isExpanded ? 'Mostrar menos' : 'Leia mais'}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-500/10">
                    <span className="text-xs text-gray-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                      <span className="text-gray-600">•</span>
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(notification.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        disabled={deletingId === notification.id}
                        className="text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 flex items-center gap-1 p-1 hover:bg-red-500/10 rounded"
                        title="Deletar notícia"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
