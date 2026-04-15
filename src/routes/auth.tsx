import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, Shield, AlertTriangle, Flower2 } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";
import CaptchaChallenge from "@/components/CaptchaChallenge";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Iniciar Sesión - Florería Girasoles" },
      { name: "description", content: "Inicia sesión o regístrate en Florería Girasoles" },
    ],
  }),
});

const emailSchema = z.string().trim().email("Email inválido").max(255);
const passwordSchema = z.string().min(8, "Mínimo 8 caracteres").max(128, "Máximo 128 caracteres")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")
  .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial");
const nameSchema = z.string().trim().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres");

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const switchMode = useCallback(() => {
    setIsLogin(v => !v);
    setError("");
    setSuccess("");
    setPasswordErrors([]);
    setCaptchaVerified(false);
  }, []);

  if (user) {
    navigate({ to: "/" });
    return null;
  }

  const validatePassword = (pwd: string) => {
    const result = passwordSchema.safeParse(pwd);
    setPasswordErrors(result.success ? [] : result.error.errors.map(e => e.message));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!captchaVerified) {
      setError("Completa la verificación de seguridad");
      return;
    }

    setLoading(true);
    try {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        setError(emailResult.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) setError(translateAuthError(error));
        else navigate({ to: "/" });
      } else {
        const nameResult = nameSchema.safeParse(fullName);
        if (!nameResult.success) {
          setError(nameResult.error.errors[0].message);
          setLoading(false);
          return;
        }
        const pwdResult = passwordSchema.safeParse(password);
        if (!pwdResult.success) {
          setError(pwdResult.error.errors[0].message);
          setLoading(false);
          return;
        }
        const { error } = await signUp(email.trim(), password, fullName.trim());
        if (error) setError(translateAuthError(error));
        else setSuccess("¡Cuenta creada! Revisa tu email para confirmar tu cuenta.");
      }
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 dots-pattern opacity-40" />
      <div className="absolute top-20 -right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -left-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Flower2 className="h-5 w-5 text-primary" />
            </div>
            <span className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              Florería <span className="text-primary">Girasoles</span>
            </span>
          </Link>
          <p className="text-muted-foreground mt-3 text-sm">
            {isLogin ? "Bienvenido de vuelta 🌻" : "Crea tu cuenta para empezar"}
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 sm:p-8 relative overflow-hidden">
          {/* Decorative corner */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full" />

          {/* Security badge */}
          <div className="flex items-center gap-2 bg-sage-light/50 text-sage rounded-lg px-3 py-2 mb-6 text-xs relative">
            <Shield className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Conexión segura con cifrado SSL/TLS</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nombre completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre"
                    maxLength={100}
                    autoComplete="name"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  maxLength={255}
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!isLogin) validatePassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  maxLength={128}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {!isLogin && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordErrors.length > 0 ? (
                    passwordErrors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" /> {err}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-secondary flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Contraseña segura
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* CAPTCHA */}
            <CaptchaChallenge onVerified={setCaptchaVerified} />

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-secondary/10 text-secondary rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 flex-shrink-0" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !captchaVerified}
              className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Procesando..." : isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={switchMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>

          {/* Security info */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-secondary" />
                Cifrado AES-256
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-secondary" />
                Protección XSS
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-secondary" />
                Anti SQL Injection
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-secondary" />
                CAPTCHA activo
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function translateAuthError(error: string): string {
  if (error.includes("Invalid login credentials")) return "Email o contraseña incorrectos";
  if (error.includes("Email not confirmed")) return "Confirma tu email antes de iniciar sesión";
  if (error.includes("User already registered")) return "Este email ya está registrado";
  if (error.includes("Password should be")) return "La contraseña no cumple los requisitos mínimos";
  if (error.includes("rate limit")) return "Demasiados intentos. Espera un momento.";
  if (error.includes("password")) return "La contraseña ha sido comprometida. Usa otra diferente.";
  return error;
}
