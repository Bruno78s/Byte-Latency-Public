import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

interface Subscription {
  expires_at: string;
  source: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Buscar perfil
      const profileRes = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Buscar assinatura
      const subRes = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Buscar função/cargo
      const roleRes = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      // Buscar licença (NÃO buscar activated_at, pois pode não existir)
      const licenseRes = await supabase
        .from("license_keys")
        .select("expires_at, used_by, is_used")
        .eq("used_by", userId)
        .eq("is_used", true)
        .maybeSingle();

      if (profileRes.error && profileRes.error.code !== 'PGRST116') {
        throw profileRes.error;
      }

      if (profileRes.data) {
        console.log("[AuthContext] Profile updated:", profileRes.data);
        setProfile(profileRes.data as Profile);
      } else {
        setProfile(null);
      }
      
      if (subRes.data) {
        setSubscription(subRes.data as Subscription);
      } else if (licenseRes.data) {
        // Se não houver assinatura mas tiver licença ativa, criar objeto de assinatura da licença
        setSubscription({
          expires_at: licenseRes.data.expires_at,
          source: 'license_key'
        } as Subscription);
      } else {
        setSubscription(null);
      }
      
      setIsAdmin(!!roleRes.data);

      console.log("[AuthContext] Admin check result:", roleRes.data ? "✓ ADMIN FOUND" : "❌ NO ADMIN ROLE");
      console.log("[AuthContext] roleRes.data:", roleRes.data);
      console.log("[AuthContext] roleRes.error:", roleRes.error);
      if (roleRes.error) {
        console.error("[AuthContext] Query error details:", JSON.stringify(roleRes.error, null, 2));
      }

      // Verificar modo de manutenção - se ativo e usuário não é admin, fazer logout
      const maintenanceResponse = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      
      if (maintenanceResponse.data?.value === 'true' && !roleRes.data) {
        // Modo de manutenção está ativo e usuário não é admin
        console.log("[AuthContext] Maintenance mode active - logging out non-admin user");
        await supabase.auth.signOut();
        toast.error("🔧 Sistema em manutenção. Tente novamente mais tarde.");
        return;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setProfile(null);
      setSubscription(null);
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Verificar sessão existente imediatamente
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) {
          return;
        }

        if (error) {
          console.error("[AuthContext] Session error:", error);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Definir loading como false imediatamente para a UI renderizar
        setIsLoading(false);
        
        if (session?.user) {
          // Buscar dados do usuário em segundo plano sem bloquear
          fetchUserData(session.user.id).catch(err => {
            console.error("[AuthContext] Fetch error:", err);
          });
        } else {
          setProfile(null);
          setSubscription(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("[AuthContext] Initialization error:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Configurar listener de estado de autenticação
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Buscar dados do usuário em segundo plano
          fetchUserData(session.user.id).catch(err => {
            console.error("[AuthContext] Fetch error:", err);
          });
        } else {
          setProfile(null);
          setSubscription(null);
          setIsAdmin(false);
        }
      }
    );

    // Inicializar autenticação
    initializeAuth();

    return () => {
      isMounted = false;
      authSub.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      subscription, 
      isAdmin, 
      isLoading, 
      signOut,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
