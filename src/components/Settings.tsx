import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Camera, Save, Eye, EyeOff, Shield, Bell, Palette, Globe, AlertTriangle, Check, Info, Download, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/hooks/useSettings";

export const Settings = () => {
  const { profile, user, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Configurações de perfil
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // Removido campo bio
  
  // Configurações de senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Sincronizar estado quando o perfil mudar
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setEmail(profile.email || user?.email || "");
      setAvatarUrl(profile.avatar_url || "");
      // Removido campo bio
    } else if (user?.email) {
      // Se não há profile mas há usuário, usar dados do user
      setEmail(user.email);
      setUsername(user.email.split('@')[0]);
    }
  }, [profile, user]);

  // Email pode ser alterado livremente
  const canChangeEmail = true;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Formato de imagem não suportado. Use JPEG, PNG, GIF ou WebP");
        return;
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Arquivo muito grande. Máximo 2MB");
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.onerror = () => {
        toast.error("Erro ao ler arquivo");
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = async () => {
    if (!username.trim()) {
      toast.error("Nome de usuário é obrigatório");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Email válido é obrigatório");
      return;
    }

    setIsLoading(true);
    
    try {
      let avatar_url = profile?.avatar_url || "";
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        avatar_url = publicUrl;
      }
      
      // Atualizar perfil no Supabase usando UPSERT para garantir que funcione mesmo se não existir
      const updateData = {
        id: user?.id,
        username: username.trim(),
        email: email.trim(),
        avatar_url,
        // Removido campo bio
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updateData, { onConflict: 'id' })
        .eq('id', user?.id);

      if (updateError) {
        console.error('Profile update error details:', updateError);
        throw updateError;
      }

      // Limpar arquivo temporário
      setAvatarFile(null);
      
      // Aguardar um pouco antes de recarregar para garantir que o banco processou
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Forçar uma atualização completa do servidor
      await refreshProfile();
      
      toast.success("Perfil atualizado com sucesso! ✨");
      
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Erro ao atualizar perfil");
      // Forçar atualização para reverter mudanças
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error("Por favor, confirme sua senha atual");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error("A senha deve conter maiúsculas, minúsculas e números");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("A nova senha deve ser diferente da atual");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!user?.email) {
        throw new Error("Usuário não autenticado");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Senha atual incorreta");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) throw updateError;
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast.success("Senha atualizada com sucesso!");
      
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(error.message || "Erro ao atualizar senha");
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const data = {
        profile: {
          username,
          email,
          // Removido campo bio
        },
        settings: settings,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bytelatency-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  };

  const deleteAccount = async () => {
    if (!currentPassword.trim()) {
      toast.error("Por favor, confirme sua senha para deletar a conta");
      return;
    }

    setIsLoading(true);
    
    try {
      if (!user?.email) {
        throw new Error("Usuário não autenticado");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Senha incorreta");
        setIsLoading(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) throw deleteError;

      await signOut();
      toast.success("Conta deletada com sucesso");
      navigate("/auth");
      
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast.error(error.message || "Erro ao deletar conta");
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "security", label: "Segurança", icon: Shield },
    { id: "notifications", label: "Notificações", icon: Bell },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "account", label: "Conta", icon: User }
  ];

  const getPasswordStrength = () => {
    if (!newPassword) return { level: 0, color: "", text: "" };
    
    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    
    if (strength <= 1) return { level: 1, color: "bg-red-500", text: "Fraca" };
    if (strength === 2) return { level: 2, color: "bg-yellow-500", text: "Regular" };
    if (strength === 3) return { level: 3, color: "bg-blue-500", text: "Boa" };
    return { level: 4, color: "bg-green-500", text: "Forte" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="flex-1 bg-[#0a0e27] overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 text-white">Configurações</h1>
        <p className="text-gray-400">Gerencie sua conta e preferências</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1f3a] rounded-2xl p-4 border border-blue-500/20">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-400 hover:text-white hover:bg-[#252b4a]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1a1f3a] rounded-2xl p-6 border border-blue-500/20 space-y-6"
          >
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
                <h2 className="text-xl font-semibold">Informações do Perfil</h2>
                
                {/* Avatar */}
                <div className="flex items-center gap-4 pb-6 border-b border-blue-500/10">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden border-2 border-blue-500/30">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Foto do Perfil</h3>
                    <p className="text-sm text-gray-400">Clique na câmera para alterar (máx 2MB)</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Nome de Usuário</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0e27] border border-blue-500/20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors text-white placeholder-gray-500"
                        placeholder="Seu nome de usuário"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-white">Email</label>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0e27] border border-blue-500/20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors text-white placeholder-gray-500"
                        placeholder="seu.email@exemplo.com"
                      />
                    </div>
                  </div>

                  {/* Campo Bio removido */}

                  {/* User Info */}
                  <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-gray-300">ID da Conta:</span>{" "}
                        <span className="text-gray-400">{user?.id}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-300">Membro desde:</span>{" "}
                        <span className="text-gray-400">{new Date(user?.created_at || "").toLocaleDateString("pt-BR")}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={updateProfile}
                  disabled={isLoading}
                  className="w-full px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <>
                <h2 className="text-xl font-semibold">Segurança</h2>
                
                {/* Requirements */}
                <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                  <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    Requisitos de Senha
                  </h3>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>✓ Mínimo de 8 caracteres</li>
                    <li>✓ Pelo menos uma letra maiúscula</li>
                    <li>✓ Pelo menos uma letra minúscula</li>
                    <li>✓ Pelo menos um número</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Senha Atual</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0e27] border border-blue-500/20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors text-white placeholder-gray-500"
                        placeholder="Digite sua senha atual"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0a0e27] border border-blue-500/20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors text-white placeholder-gray-500"
                        placeholder="Digite a nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.level ? passwordStrength.color : "bg-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">Força: <span className={`font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>{passwordStrength.text}</span></p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Confirmar Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0a0e27] border border-blue-500/20 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors text-white placeholder-gray-500"
                        placeholder="Confirme a nova senha"
                      />
                      {confirmPassword && newPassword === confirmPassword && (
                        <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={updatePassword}
                  disabled={isLoading || !newPassword || !currentPassword || !confirmPassword}
                  className="w-full px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Atualizar Senha
                    </>
                  )}
                </button>
              </>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <>
                <h2 className="text-xl font-semibold">Notificações</h2>
                <div className="space-y-3">
                  {/* Relatório Semanal */}
                  <div className="flex items-center justify-between p-4 bg-[#0a0e27] rounded-xl border border-blue-500/10 hover:border-blue-500/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-purple-400" />
                      <div>
                        <h3 className="text-sm font-medium text-white">Relatório Semanal</h3>
                        <p className="text-xs text-gray-500">Resumo semanal de suas métricas. <span className="text-purple-400">(Enviado por email toda segunda-feira)</span></p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await updateSetting("weeklyReport", !(settings as any).weeklyReport);
                        toast.success("Preferência de relatório semanal salva!");
                      }}
                      className={`relative w-11 h-6 rounded-full transition-all ${(settings as any).weeklyReport ? "bg-blue-500" : "bg-gray-700"}`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          (settings as any).weeklyReport ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Discord Rich Presence */}
                  <div className="flex items-center justify-between p-4 bg-[#0a0e27] rounded-xl border border-blue-500/10 hover:border-blue-500/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h3 className="text-sm font-medium text-white">Discord Rich Presence</h3>
                        <p className="text-xs text-gray-500">Mostrar atividade do Byte Latency no Discord</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const enabled = !(settings as any).discordRichPresence;
                        await updateSetting("discordRichPresence", enabled);
                        if (window.electron && window.electron.enableDiscordRPC && window.electron.disableDiscordRPC) {
                          if (enabled) {
                            window.electron.enableDiscordRPC();
                            toast.success("Discord Rich Presence ativado!");
                          } else {
                            window.electron.disableDiscordRPC();
                            toast.info("Discord Rich Presence desativado.");
                          }
                        } else {
                          toast.error("Integração Discord não disponível no ambiente atual.");
                        }
                      }}
                      className={`relative w-11 h-6 rounded-full transition-all ${(settings as any).discordRichPresence ? "bg-blue-500" : "bg-gray-700"}`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          (settings as any).discordRichPresence ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20 flex items-center gap-2 mt-4">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-white">Configurações Salvas</h3>
                    <p className="text-xs text-gray-400">Todas as alterações são salvas automaticamente</p>
                  </div>
                </div>
              </>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <>
                <h2 className="text-xl font-semibold">Aparência</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Tema</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "dark", label: "Escuro", icon: "🌙" },
                        { value: "light", label: "Claro", icon: "☀️" },
                        { value: "system", label: "Sistema", icon: "💻" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateSetting("theme", option.value as any)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            settings.theme === option.value
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-blue-500/20 hover:border-blue-500/40"
                          }`}
                        >
                          <div className="text-2xl mb-2">{option.icon}</div>
                          <div className="text-xs font-medium text-white">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  


                  <div className="space-y-3">
                    {[
                      { key: "compactMode", title: "Modo Compacto", desc: "Reduza o espaçamento (nao disponivel)" },
                      { key: "autoSave", title: "Salvamento Automático", desc: "Salve configurações automaticamente" }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-[#0a0e27] rounded-xl border border-blue-500/10">
                        <div>
                          <h3 className="text-sm font-medium text-white">{item.title}</h3>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => updateSetting(item.key as any, !(settings as any)[item.key])}
                          className={`relative w-11 h-6 rounded-full transition-all ${ (settings as any)[item.key] ? "bg-blue-500" : "bg-gray-700"}`}
                        >
                          <span
                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              (settings as any)[item.key] ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <>
                <h2 className="text-xl font-semibold">Gerenciar Conta</h2>
                
                <div className="space-y-3">
                  <div className="p-4 bg-[#0a0e27] rounded-xl border border-blue-500/10 flex items-center justify-between hover:border-blue-500/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="text-sm font-medium text-white">Exportar Dados</h3>
                        <p className="text-xs text-gray-500">Download em formato JSON</p>
                      </div>
                    </div>
                    <button
                      onClick={exportData}
                      className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-medium transition-colors"
                    >
                      Exportar
                    </button>
                  </div>

                  <div className="p-4 bg-[#0a0e27] rounded-xl border border-orange-500/10 flex items-center justify-between hover:border-orange-500/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 text-orange-400" />
                      <div>
                        <h3 className="text-sm font-medium text-white">Sair da Conta</h3>
                        <p className="text-xs text-gray-500">Desconecte-se desta sessão</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 text-xs font-medium transition-colors"
                    >
                      Sair
                    </button>
                  </div>

                  <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20 flex items-center justify-between hover:border-red-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div>
                        <h3 className="text-sm font-medium text-white">Zona de Perigo</h3>
                        <p className="text-xs text-gray-500">Deletar permanentemente sua conta</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs font-medium transition-colors"
                    >
                      Deletar
                    </button>
                  </div>
                </div>

                {/* Delete Dialog */}
                {showDeleteDialog && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#1a1f3a] max-w-md w-full p-6 rounded-xl border border-red-500/30"
                    >
                      <div className="flex gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">Deletar Conta</h3>
                          <p className="text-xs text-gray-400 mt-1">
                            Esta ação é irreversível. Todos os dados serão permanentemente deletados.
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-white mb-2">
                          Confirme sua senha
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#0a0e27] border border-blue-500/20 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-colors text-white placeholder-gray-500"
                          placeholder="Sua senha"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDeleteDialog(false);
                            setCurrentPassword("");
                          }}
                          className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={deleteAccount}
                          disabled={isLoading || !currentPassword}
                          className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Deletando..." : "Confirmar"}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
