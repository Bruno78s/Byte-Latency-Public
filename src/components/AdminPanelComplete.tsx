import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, Shield, Key, 
  Bell, Database, Download, Trash2, CheckCircle, 
  XCircle, Search, TrendingUp, AlertTriangle,
  UserPlus, Lock,
  Unlock, RefreshCw, BarChart3,
  Server, Zap, Copy, Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SystemConfig, Notification } from "@/types-supabase-extra";

interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  role?: string;
  subscription_status?: string;
}

interface License {
  id: string;
  key: string;
  duration_days: number;
  is_used: boolean;
  created_at: string;
  used_at?: string;
  expires_at?: string;
  used_by?: string;
  created_by?: string;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalLicenses: number;
  usedLicenses: number;
  adminCount: number;
  storageUsed: number;
}

interface AdminPanelProps {
  activeSubTab?: string;
}

export const AdminPanelComplete = ({ activeSubTab }: AdminPanelProps) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState(activeSubTab?.replace('admin-', '') || "overview");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalLicenses: 0,
    usedLicenses: 0,
    adminCount: 0,
    storageUsed: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [emailData, setEmailData] = useState({
    recipient: 'all',
    subject: '',
    message: ''
  });

  const [newLicense, setNewLicense] = useState({
    plan_type: "PRO",
    duration_days: 30,
    quantity: 1
  });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    duration_hours: 24 as number
  });

  useEffect(() => {
    if (activeSubTab) setActiveTab(activeSubTab.replace('admin-', ''));
  }, [activeSubTab]);

  useEffect(() => {
    loadData();
    checkExpiringLicenses();
    
    // Atualizar dados a cada 10 segundos para manter estatísticas atualizadas
    const dataInterval = setInterval(() => {
      loadData();
    }, 10000);

    // Verificar licenças expirando a cada 1 hora
    const licenseInterval = setInterval(() => {
      checkExpiringLicenses();
    }, 60 * 60 * 1000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(licenseInterval);
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadUsers(), loadLicenses(), loadStats(), loadMaintenanceMode()]);
    } catch (error) {
      console.error("Error loading admin data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) return;

    const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');
    const { data: subsData } = await supabase.from('user_subscriptions').select('user_id, expires_at');

    const now = new Date();
    const enrichedUsers = profilesData.map(profile => {
      const sub = subsData?.find(s => s.user_id === profile.id && s.expires_at && new Date(s.expires_at) > now);
      return {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        created_at: profile.created_at,
        role: rolesData?.find(r => r.user_id === profile.id)?.role || 'user',
        subscription_status: sub ? 'active' : 'free'
      };
    });

    setUsers(enrichedUsers);
  };

  const loadLicenses = async () => {
    const { data, error } = await supabase
      .from('license_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setLicenses(data as unknown as License[]);
  };

  const loadStats = async () => {
    const { data: profilesData } = await supabase.from('profiles').select('id');
    const { data: rolesData } = await supabase.from('user_roles').select('role').eq('role', 'admin');
    const { data: licensesData } = await supabase.from('license_keys').select('is_used');

    setStats({
      totalUsers: profilesData?.length || 0,
      activeUsers: profilesData?.length || 0,
      totalLicenses: licensesData?.length || 0,
      usedLicenses: licensesData?.filter(l => l.is_used).length || 0,
      adminCount: rolesData?.length || 0,
      storageUsed: 0
    });
  };

  const createLicenses = async () => {
    setIsLoading(true);
    try {
      const newKeys = [];
      const now = new Date();
      
      console.log('Creating licenses with user:', user?.id);
      
      for (let i = 0; i < newLicense.quantity; i++) {
        // Gerar chave no formato: XXXX-XXXX-XXXX-XXXX
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let key = "";
        for (let j = 0; j < 4; j++) {
          if (j > 0) key += "-";
          for (let k = 0; k < 4; k++) {
            const randomBytes = new Uint32Array(1);
            const randomIndex = crypto.getRandomValues(randomBytes)[0] % chars.length;
            key += chars[randomIndex];
          }
        }
        
        const expiresAt = new Date(now.getTime() + newLicense.duration_days * 24 * 60 * 60 * 1000).toISOString();
        
        newKeys.push({
          key: key,
          is_used: false,
          expires_at: expiresAt
        });
      }

      console.log('Inserting licenses:', newKeys);
      
      const { data, error } = await supabase.from('license_keys').insert(newKeys).select();
      if (error) {
        console.error("Error creating licenses:", error);
        throw error;
      }

      console.log('Licenses created successfully:', data);
      toast.success(`${newLicense.quantity} licença(s) criada(s)!`);
      setShowLicenseModal(false);
      loadLicenses();
      loadStats();
    } catch (error) {
      console.error("Error in createLicenses:", error);
      toast.error("Erro ao criar licenças");
    } finally {
      setIsLoading(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success("Chave copiada!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadMaintenanceMode = async () => {
    try {
      const response = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      
      if (response.error) throw response.error;
      setMaintenanceMode(response.data?.value === 'true');
    } catch (error) {
      console.error("Error loading maintenance mode:", error);
    }
  };

  const checkExpiringLicenses = async () => {
    try {
      // Buscar todas as subscriptions ativas (query simplificada para evitar type depth)
      const query = (supabase as any)
        .from('user_subscriptions')
        .select('user_id, expires_at')
        .eq('status', 'active');

      const { data: subscriptions, error }: any = await query;

      if (error) throw error;

      const now = new Date();
      const threeHoursFromNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));

      for (const sub of subscriptions || []) {
        const expiresAt = new Date(sub.expires_at);
        
        // Verificar se expira nas próximas 3 horas
        if (expiresAt > now && expiresAt <= threeHoursFromNow) {
          // Log apenas - emails são enviados pelo Supabase Auth automaticamente
          console.log(`[License Expiring] User ${sub.user_id} expires at ${expiresAt.toISOString()}`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar licenças expirando:', error);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const newValue = !maintenanceMode;
      const { error } = await supabase
        .from('system_config')
        .update({ 
          value: newValue.toString(),
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('key', 'maintenance_mode');
      
      if (error) throw error;
      
      setMaintenanceMode(newValue);
      toast.success(newValue ? "🔧 Modo manutenção ATIVADO" : "✅ Modo manutenção DESATIVADO");
    } catch (error) {
      console.error("Error toggling maintenance mode:", error);
      toast.error("Erro ao alterar modo manutenção");
    }
  };

  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast.error("Preencha título e mensagem");
      return;
    }

    try {
      const expiresAt = new Date();
      const durationHours = notificationForm.duration_hours || 24;
      expiresAt.setHours(expiresAt.getHours() + durationHours);
      
      console.log('Sending notification:', {
        title: notificationForm.title,
        message: notificationForm.message,
        created_by: user?.id,
        expires_at: expiresAt.toISOString()
      });
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          title: notificationForm.title,
          message: notificationForm.message,
          created_by: user?.id,
          expires_at: expiresAt.toISOString()
        })
        .select();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log('Notification sent:', data);
      toast.success("📢 Notificação enviada para todos os usuários!");
      setNotificationForm({ title: "", message: "", duration_hours: 24 });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error(`Erro: ${error.message || 'Erro ao enviar notificação'}`);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'promover a Admin' : 'remover de Admin';
    
    if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;

    try {
      if (newRole === 'admin') {
        // Promover: inserir ou atualizar role
        const { error } = await supabase
          .from('user_roles')
          .upsert({ 
            user_id: userId, 
            role: 'admin',
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
        if (error) throw error;
      } else {
        // Despromover: deletar da tabela user_roles
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);
        if (error) throw error;
      }

      toast.success(`✅ Usuário ${newRole === 'admin' ? 'promovido a Admin' : 'removido de Admin'}!`);
      await loadUsers();
      await loadStats();
    } catch (error: any) {
      console.error('Erro ao atualizar role:', error);
      toast.error(`Erro: ${error.message || 'Erro ao atualizar permissões'}`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("⚠️ ATENÇÃO: Deletar usuário? Esta ação é IRREVERSÍVEL!")) return;
    if (!confirm("Tem certeza absoluta? Todos os dados do usuário serão perdidos!")) return;

    setIsLoading(true);
    try {
      // Deletar role do usuário (se existir)
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Deletar subscriptions do usuário
      await supabase.from('user_subscriptions').delete().eq('user_id', userId);
      
      // Deletar perfil do usuário
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;

      toast.success("🗑️ Usuário deletado com sucesso!");
      await loadUsers();
      await loadStats();
      setShowUserModal(false);
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      toast.error(`Erro: ${error.message || 'Erro ao deletar usuário'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLicense = async (licenseId: string) => {
    if (!confirm("Deletar licença?")) return;

    try {
      const { error } = await supabase.from('license_keys').delete().eq('id', licenseId);
      if (error) throw error;

      toast.success("Licença deletada");
      loadLicenses();
      loadStats();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao deletar licença");
      console.error("Erro ao deletar licença:", error);
    }
  };

  const deleteAllLicenses = async () => {
    if (!confirm("⚠️ ATENÇÃO: Deletar TODAS as licenças? Esta ação não pode ser desfeita!")) return;
    if (!confirm("Tem certeza absoluta? Digite SIM para confirmar.")) return;

    try {
      const { error } = await supabase.from('license_keys').delete().not('id', 'is', null);
      if (error) throw error;

      toast.success("Todas as licenças foram deletadas!");
      loadLicenses();
      loadStats();
    } catch (error) {
      toast.error("Erro ao deletar licenças");
    }
  };

  const sendEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      toast.error("Preencha assunto e mensagem");
      return;
    }

    try {
      // Exemplo: chamada para Supabase Edge Function ou backend próprio
      const res = await fetch("http://localhost:3001/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: emailData.subject,
          message: emailData.message,
          to: emailData.recipient,
        })
      });
      if (!res.ok) throw new Error("Falha ao enviar email");
      toast.success("Email enviado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao enviar email: " + (err?.message || err));
    }
    setShowEmailModal(false);
  };

  const exportData = (type: 'users' | 'licenses') => {
    const data = type === 'users' ? users : licenses;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${type} exportados!`);
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "users", label: "Usuários", icon: Users },
    { id: "generate", label: "Licenças", icon: Key },
    { id: "system", label: "Sistema", icon: Server },
    { id: "notifications", label: "Notificações", icon: Bell },
  ];

  return (
    <div className="flex-1 bg-[#0a0e27] overflow-y-auto p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-400" />
              Painel de Administração
            </h1>
            <p className="text-gray-400 mt-1">Gerenciamento completo do Byte Latency</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-[#1a1f3a] text-gray-400 hover:text-white hover:bg-[#252b4a]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-400" />
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />+12%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.totalUsers}</h3>
              <p className="text-sm text-gray-400">Total de Usuários</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-[#1a1f3a] rounded-2xl p-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-8 h-8 text-purple-400" />
                <span className="text-xs text-gray-400">{stats.adminCount} admins</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.activeUsers}</h3>
              <p className="text-sm text-gray-400">Usuários Ativos</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-[#1a1f3a] rounded-2xl p-6 border border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <Key className="w-8 h-8 text-green-400" />
                <span className="text-xs text-yellow-400">{stats.usedLicenses} usadas</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.totalLicenses}</h3>
              <p className="text-sm text-gray-400">Licenças Totais</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-[#1a1f3a] rounded-2xl p-6 border border-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <Database className="w-8 h-8 text-orange-400" />
                <span className="text-xs text-green-400">Ótimo</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stats.storageUsed} MB</h3>
              <p className="text-sm text-gray-400">Armazenamento</p>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => setShowLicenseModal(true)}
                className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors">
                <Key className="w-6 h-6 text-blue-400 mb-2" />
                <p className="text-sm font-medium text-white">Criar Licenças</p>
              </button>
              
              <button onClick={() => setActiveTab("users")}
                className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors">
                <Users className="w-6 h-6 text-purple-400 mb-2" />
                <p className="text-sm font-medium text-white">Ver Usuários</p>
              </button>

              <button onClick={() => setShowEmailModal(true)}
                className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors">
                <Bell className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-sm font-medium text-white">Enviar Email</p>
              </button>

              <button onClick={() => exportData('users')}
                className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-colors">
                <Download className="w-6 h-6 text-orange-400 mb-2" />
                <p className="text-sm font-medium text-white">Exportar Dados</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Atividade Recente</h2>
            <div className="space-y-3">
              {users.slice(0, 5).map((u, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0e27] border border-blue-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{u.username}</p>
                      <p className="text-xs text-gray-400">Novo usuário</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar usuários..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1a1f3a] border border-blue-500/20 focus:border-blue-500 focus:outline-none text-white" />
            </div>
            <button onClick={() => exportData('users')}
              className="px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />Exportar
            </button>
          </div>

          <div className="bg-[#1a1f3a] rounded-2xl border border-blue-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-500/20">
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Usuário</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Cadastro</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-blue-500/10 hover:bg-[#252b4a] transition-colors">
                      <td className="p-4"><span className="text-sm font-medium text-white">{u.username}</span></td>
                      <td className="p-4 text-sm text-gray-400">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          u.subscription_status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>{u.subscription_status === 'active' ? 'PRO' : 'Free'}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => toggleUserRole(u.id, u.role || 'user')}
                            className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
                            {u.role === 'admin' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button onClick={() => deleteUser(u.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Licenses Tab */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <button onClick={() => setShowLicenseModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2">
              <Key className="w-4 h-4" />Criar Licenças
            </button>
            <button onClick={() => exportData('licenses')}
              className="px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 flex items-center gap-2">
              <Download className="w-4 h-4" />Exportar
            </button>
            <button onClick={deleteAllLicenses}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />Deletar Todas
            </button>
          </div>

          <div className="bg-[#1a1f3a] rounded-2xl border border-blue-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-500/20">
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Chave</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Plano</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Duração</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Criado</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((l) => {
                    // Calcular duração de expires_at - created_at
                    const durationDays = Math.ceil(
                      (new Date(l.expires_at).getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                    <tr key={l.id} className="border-b border-blue-500/10 hover:bg-[#252b4a]">
                      <td className="p-4">
                        <code className="text-sm font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                          {l.key}
                        </code>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-400">
                          License
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{durationDays} dias</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          l.is_used ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                        }`}>{l.is_used ? 'Usada' : 'Disponível'}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {new Date(l.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => copyKey(l.key)}
                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                            {copiedKey === l.key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button onClick={() => deleteLicense(l.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === "system" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Banco de Dados</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />Online
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Registros</span>
                  <span className="text-white font-medium">{stats.totalUsers + stats.totalLicenses}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Servidor</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />Ativo
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-white font-medium">99.9%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20">
            <h3 className="text-lg font-semibold text-white mb-4">Manutenção</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={() => toast.success("Cache limpo!")}
                className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-left">
                <RefreshCw className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-sm font-medium text-white">Limpar Cache</p>
              </button>

              <button onClick={() => toast.success("Backup iniciado!")}
                className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-left">
                <Download className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-sm font-medium text-white">Backup</p>
              </button>

              <button onClick={() => toast.info("Verificando...")}
                className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-left">
                <AlertTriangle className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-sm font-medium text-white">Diagnóstico</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {/* Maintenance Mode Toggle */}
          <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Modo Manutenção
                </h3>
                <p className="text-sm text-gray-400">
                  {maintenanceMode 
                    ? "⚠️ Sistema em manutenção - Apenas admins podem acessar" 
                    : "Sistema funcionando normalmente"}
                </p>
              </div>
              <button
                onClick={toggleMaintenanceMode}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                  maintenanceMode
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {maintenanceMode ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                {maintenanceMode ? "DESATIVAR" : "ATIVAR"}
              </button>
            </div>
          </div>

          {/* Send Notification */}
          <div className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20">
            <h3 className="text-lg font-semibold text-white mb-4">Enviar Notificação em Massa</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Título</label>
                <input 
                  type="text" 
                  placeholder="Título da notificação"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0e27] border border-blue-500/20 focus:border-blue-500 focus:outline-none text-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mensagem</label>
                <textarea 
                  rows={4} 
                  placeholder="Conteúdo..."
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0e27] border border-blue-500/20 focus:border-blue-500 focus:outline-none text-white resize-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Duração da Notícia</label>
                <select 
                  value={notificationForm.duration_hours}
                  onChange={(e) => setNotificationForm({ ...notificationForm, duration_hours: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0e27] border border-blue-500/20 focus:border-blue-500 focus:outline-none text-white"
                >
                  <option value="1">1 hora</option>
                  <option value="6">6 horas</option>
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                  <option value="48">2 dias</option>
                  <option value="72">3 dias</option>
                  <option value="168">1 semana</option>
                  <option value="720">30 dias</option>
                </select>
              </div>
              <button 
                onClick={sendNotification}
                disabled={!notificationForm.title || !notificationForm.message}
                className="w-full px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Bell className="w-4 h-4" />Enviar para Todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1f3a] max-w-2xl w-full p-6 rounded-2xl border border-blue-500/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Enviar Email para Usuários</h3>
              <button onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Destinatário</label>
                <select 
                  value={emailData.recipient}
                  onChange={(e) => setEmailData({ ...emailData, recipient: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0e27] border border-blue-500/20 text-white">
                  <option value="all">Todos os usuários ({users.length})</option>
                  <option disabled>──────────</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Assunto</label>
                <input 
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  placeholder="Ex: Atualização importante do Byte Latency"
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0e27] border border-blue-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mensagem</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  placeholder="Digite sua mensagem aqui..."
                  rows={8}
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0e27] border border-blue-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-400">
                  💡 <strong>Dica:</strong> O email será enviado para {emailData.recipient === 'all' ? `todos os ${users.length} usuários` : '1 usuário específico'}.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-500/10 text-gray-400 hover:bg-gray-500/20">
                Cancelar
              </button>
              <button onClick={sendEmail} disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" />
                {isLoading ? "Enviando..." : "Enviar Email"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* License Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1f3a] max-w-md w-full p-6 rounded-2xl border border-blue-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">Criar Licenças</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                <select value={newLicense.plan_type} onChange={(e) => setNewLicense({ ...newLicense, plan_type: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0e27] border border-blue-500/20 text-white">
                  <option value="PRO">PRO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Duração (dias)</label>
                <input type="number" value={newLicense.duration_days}
                  onChange={(e) => setNewLicense({ ...newLicense, duration_days: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0e27] border border-blue-500/20 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Quantidade</label>
                <input type="number" value={newLicense.quantity}
                  onChange={(e) => setNewLicense({ ...newLicense, quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0e27] border border-blue-500/20 text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowLicenseModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-500/10 text-gray-400 hover:bg-gray-500/20">
                Cancelar
              </button>
              <button onClick={createLicenses} disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50">
                {isLoading ? "Criando..." : "Criar"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
