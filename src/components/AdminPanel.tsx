import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  Shield, 
  Key, 
  Users, 
  Plus, 
  Copy, 
  Check, 
  Trash2,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface LicenseKey {
  id: string;
  key: string;
  duration_days: number;
  is_used: boolean;
  created_at: string;
  used_at: string | null;
  expires_at: string | null;
}

export const AdminPanel = ({ activeSubTab }: { activeSubTab?: string }) => {
  const { user, isAdmin } = useAuth();
  const [subTab, setSubTab] = useState<string>(activeSubTab || 'admin-generate');
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);

  const fetchKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("license_keys")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching keys:", error);
        toast.error("Erro ao carregar keys");
        setKeys([]);
        return;
      }

      setKeys((data || []) as LicenseKey[]);
    } catch (err) {
      console.error("Unexpected error fetching keys:", err);
      toast.error("Erro ao processar requisição");
      setKeys([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  useEffect(() => {
    if (activeSubTab) setSubTab(activeSubTab);
  }, [activeSubTab]);

  const generateKey = async () => {
    setIsGenerating(true);

    try {
      // Gerar chave localmente usando crypto para melhor aleatoriedade
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let key = "";
      
      // Generate 4 groups of 4 characters
      for (let i = 0; i < 4; i++) {
        if (i > 0) key += "-";
        for (let j = 0; j < 4; j++) {
          // Use crypto.getRandomValues for better randomness if available
          const randomBytes = new Uint32Array(1);
          const randomIndex = crypto.getRandomValues(randomBytes)[0] % chars.length;
          key += chars[randomIndex];
        }
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + selectedDuration * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from("license_keys")
        .insert({
          key,
          duration_days: selectedDuration,
          created_by: user?.id,
          is_used: false,
          created_at: now.toISOString(),
          expires_at: expiresAt
        });

      if (error) {
        console.error("Error generating key:", error);
        toast.error("Erro ao gerar key");
      } else {
        toast.success("Key gerada com sucesso!");
        fetchKeys();
      }
    } catch (err) {
      console.error("Unexpected error generating key:", err);
      toast.error("Erro ao processar requisição");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success("Key copiada!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const deleteKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from("license_keys")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting key:", error);
        toast.error("Erro ao deletar key");
      } else {
        toast.success("Key deletada!");
        fetchKeys();
      }
    } catch (err) {
      console.error("Unexpected error deleting key:", err);
      toast.error("Erro ao processar requisição");
    }
  };

  const stats = {
    total: keys.length,
    used: keys.filter(k => k.is_used).length,
    unused: keys.filter(k => !k.is_used).length,
  };

  // Verificar role do usuário
  if (!isAdmin) {
    return <div>Access denied. Admins only.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Administração
          </h2>
          <p className="text-muted-foreground mt-1">Gerencie license keys e usuários</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('admin-generate')}
            className={`px-3 py-2 rounded ${subTab === 'admin-generate' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/20'}`}
          >
            Gerar Key
          </button>
          <button
            onClick={() => setSubTab('admin-keys')}
            className={`px-3 py-2 rounded ${subTab === 'admin-keys' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/20'}`}
          >
            Keys
          </button>
          <button
            onClick={() => setSubTab('admin-users')}
            className={`px-3 py-2 rounded ${subTab === 'admin-users' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted/20'}`}
          >
            Usuários
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Keys</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.unused}</p>
              <p className="text-sm text-muted-foreground">Disponíveis</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <XCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{stats.used}</p>
              <p className="text-sm text-muted-foreground">Utilizadas</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Generate Key Section */}
      {subTab === 'admin-generate' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Gerar Nova Key
          </h3>

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">Duração (dias)</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none transition-colors"
              >
                <option value={1}>1 dia</option>
                <option value={7}>7 dias</option>
                <option value={30}>30 dias</option>
                <option value={90}>90 dias</option>
                <option value={365}>365 dias (1 ano)</option>
              </select>
            </div>

            <button
              onClick={generateKey}
              disabled={isGenerating}
              className="px-6 py-3 rounded-lg gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              {isGenerating ? "Gerando..." : "Gerar Key"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Keys List */}
      {subTab === 'admin-keys' && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          License Keys
        </h3>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma key gerada ainda
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto">
            {keys.map((key, index) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  key.is_used 
                    ? "bg-muted/30 border-border/50" 
                    : "bg-muted/50 border-primary/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${key.is_used ? "bg-muted" : "bg-primary/10"}`}>
                    <Key className={`w-4 h-4 ${key.is_used ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div>
                    <p className={`font-mono font-bold ${key.is_used ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {key.key}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {key.duration_days} dias
                      </span>
                      <span>
                        Criada: {new Date(key.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      {key.is_used && key.used_at && (
                        <span className="text-warning">
                          Usada: {new Date(key.used_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                    {/* Show who created and who is using the key */}
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      {(key as any).created_by_profile?.username && (
                        <span className="text-blue-400">
                          Criada por: {(key as any).created_by_profile.username}
                        </span>
                      )}
                      {(key as any).used_by_profile?.username && (
                        <span className="text-green-400">
                          Usando: {(key as any).used_by_profile.username}
                        </span>
                      )}
                    </div>
                    {/* Show expiration info */}
                    {key.expires_at && (
                      <div className="mt-1 text-xs">
                        {new Date(key.expires_at) > new Date() ? (
                          <span className="text-success">
                            Expira em: {Math.ceil((new Date(key.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                          </span>
                        ) : (
                          <span className="text-destructive">
                            Expirou em: {new Date(key.expires_at).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    key.is_used 
                      ? "bg-warning/10 text-warning" 
                      : "bg-success/10 text-success"
                  }`}>
                    {key.is_used ? "Usada" : "Disponível"}
                  </span>

                  {!key.is_used && (
                    <button
                      onClick={() => copyKey(key.key)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      {copiedKey === key.key ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => deleteKey(key.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      )}
    </div>
  );
};
