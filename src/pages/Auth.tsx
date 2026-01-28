import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, Lock, User, Key, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const signupSchema = z.object({
  username: z.string().trim().min(3, "Username deve ter pelo menos 3 caracteres").max(20, "Username muito longo"),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  licenseKey: z.string().optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    licenseKey: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      if (isLogin) {
        loginSchema.parse({ email: formData.email, password: formData.password });
      } else {
        signupSchema.parse(formData);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          setIsLoading(false);
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (data?.user) {
          toast.success("Login realizado com sucesso!");
          setTimeout(() => {
            navigate("/");
          }, 500);
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: 'https://bytelatency.com/',
            data: {
              username: formData.username,
            },
          },
        });

        if (signUpError) {
          setIsLoading(false);
          if (signUpError.message.includes("already registered")) {
            toast.error("Este email já está cadastrado");
          } else if (signUpError.message.includes("invalid")) {
            toast.error("Dados inválidos fornecidos");
          } else {
            toast.error(signUpError.message || "Erro ao criar conta");
          }
          return;
        }

        // A chave de licença é opcional no cadastro - pode ser resgatada depois no painel
        if (formData.licenseKey && formData.licenseKey.trim()) {
          try {
            const { data: redeemData, error: redeemError } = await supabase
              .rpc("redeem_license_key", { p_key: formData.licenseKey.toUpperCase() });

            if (redeemError) {
              toast.warning("Conta criada, mas a key não pôde ser ativada");
            } else if (redeemData && typeof redeemData === 'object' && 'success' in redeemData) {
              if ((redeemData as { success: boolean }).success) {
                toast.success("Key ativada com sucesso!");
              } else {
                toast.warning((redeemData as { message: string }).message || "Key inválida");
              }
            }
          } catch (err) {
            toast.warning("Conta criada, mas houve erro ao ativar a key");
          }
        }

        toast.success("Conta criada com sucesso! Por favor, verifique seu email.");
        setTimeout(() => {
          setIsLoading(false);
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Auth error:", error);
      setIsLoading(false);
      toast.error("Erro ao processar sua solicitação");
    }
  };


  return (
    <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Card - Professional Design */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Premium Logo Container */}
          <div className="mb-8 flex justify-center">
            <motion.div
              className="inline-flex items-center justify-center w-40 h-40 bg-transparent border-2 border-blue-500/60 rounded-3xl shadow-2xl shadow-blue-500/40"
              whileHover={{ scale: 1.05, borderColor: "rgb(59, 130, 246)" }}
              whileTap={{ scale: 0.95 }}
            >
              <img src="./Logo1-removebg-preview.png" alt="Latency Logo" className="h-32 w-auto drop-shadow-2xl" />
            </motion.div>
          </div>

          {/* Brand Title */}
          <div className="space-y-1">
            <h1 className="font-bold text-5xl text-white tracking-tight">
              BYTE <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">LATENCY</span>
            </h1>
            <p className="text-xs font-semibold text-blue-400 tracking-[0.2em] uppercase">Performance Optimizer</p>
          </div>
        </motion.div>

        {/* Auth Card - Premium Design */}
        <motion.div 
          className="bg-[#1a1f3a]/95 backdrop-blur-2xl p-10 rounded-3xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Decorative gradient lines */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          {/* Tab Switcher */}
          <div className="flex rounded-2xl bg-[#0a0e27]/50 p-1.5 mb-8 border border-blue-500/20">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isLogin
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                !isLogin
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/40"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Criar Conta
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-semibold text-white mb-2.5">
                    <User className="w-4 h-4 inline mr-2 text-blue-400" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#0a0e27]/50 border border-blue-500/30 focus:border-blue-500 focus:bg-[#0a0e27] focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder-gray-600"
                    placeholder="Seu username"
                  />
                  {errors.username && <p className="text-red-400 text-xs mt-2 ml-1">{errors.username}</p>}
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">
                  <Mail className="w-4 h-4 inline mr-2 text-blue-400" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl bg-[#0a0e27]/50 border border-blue-500/30 focus:border-blue-500 focus:bg-[#0a0e27] focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder-gray-600"
                  placeholder="seu@email.com"
                />
                {errors.email && <p className="text-red-400 text-xs mt-2 ml-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">
                  <Lock className="w-4 h-4 inline mr-2 text-blue-400" />
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#0a0e27]/50 border border-blue-500/30 focus:border-blue-500 focus:bg-[#0a0e27] focus:ring-1 focus:ring-blue-500/30 focus:outline-none transition-all text-white placeholder-gray-600 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-2 ml-1">{errors.password}</p>}
              </div>

              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-semibold text-white mb-2.5">
                    <Key className="w-4 h-4 inline mr-2 text-purple-400" />
                    License Key <span className="text-gray-500 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.licenseKey}
                    onChange={(e) => setFormData({ ...formData, licenseKey: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#0a0e27]/50 border border-purple-500/30 focus:border-purple-500 focus:bg-[#0a0e27] focus:ring-1 focus:ring-purple-500/30 focus:outline-none transition-all text-white placeholder-gray-600 font-mono tracking-widest"
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    maxLength={19}
                  />
                  <p className="text-xs text-gray-500 mt-2 ml-1">Você pode ativar depois no painel</p>
                  {errors.licenseKey && <p className="text-red-400 text-xs mt-2 ml-1">{errors.licenseKey}</p>}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white font-bold text-base hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50 transform hover:scale-[1.02] active:scale-[0.98] mt-8 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : isLogin ? (
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <LogIn className="w-5 h-5" />
                    Entrar agora
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 relative z-10">
                    <UserPlus className="w-5 h-5" />
                    Criar conta
                  </div>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-blue-500/20">
            <p className="text-center text-sm text-gray-400">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
              {" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
              >
                {isLogin ? "Criar agora" : "Entrar"}
              </button>
            </p>
          </div>
        </motion.div>

        {/* Security Badge */}
        <motion.div 
          className="text-center text-xs text-gray-500 mt-6 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>Byte Latency v1.0 © 2026 TODOS OS DIREITOS RESERVADOS</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
