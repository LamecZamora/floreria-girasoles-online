import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Lock, AlertTriangle, Flower2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Restablecer contraseña - Florería Girasoles" },
      { name: "description", content: "Establece una nueva contraseña para tu cuenta" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const passwordSchema = z.string().min(8, "Mínimo 8 caracteres").max(128, "Máximo 128 caracteres")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")
  .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial");

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the recovery token automatically from the URL hash
    // and creates a temporary session. We just need to verify there's a session.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasRecoverySession(!!session);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setHasRecoverySession(true);
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const validatePassword = (pwd: string) => {
    const result = passwordSchema.safeParse(pwd);
    setPasswordErrors(result.success ? [] : result.error.errors.map(e => e.message));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pwdResult = passwordSchema.safeParse(password);
    if (!pwdResult.success) {
      setError(pwdResult.error.errors[0].message);
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      setError(error.includes("password") ? "La contraseña ha sido comprometida. Usa otra diferente." : error);
      return;
    }

    setSuccess(true);
    // Sign out and redirect to login after 2.5s so user logs in with new password
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
    }, 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 dots-pattern opacity-20" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-primary/8 rounded-full blur-[100px]" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent/8 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Flower2 className="h-5 w-5 text-primary" />
            </div>
            <span className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              Florería <span className="text-primary">Girasoles</span>
            </span>
          </Link>
          <p className="text-muted-foreground mt-3 text-sm">Establece tu nueva contraseña</p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border/40 p-6 sm:p-8">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h2 className="font-heading text-xl font-bold text-foreground">¡Contraseña actualizada!</h2>
              <p className="text-sm text-muted-foreground">Te redirigiremos al inicio de sesión...</p>
            </div>
          ) : !hasRecoverySession ? (
            <div className="text-center py-6 space-y-3">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
              <h2 className="font-heading text-lg font-bold text-foreground">Enlace inválido o expirado</h2>
              <p className="text-sm text-muted-foreground">
                Solicita un nuevo enlace desde la página de inicio de sesión.
              </p>
              <Link to="/auth" className="inline-block btn-primary mt-2 px-4 py-2 text-sm">
                Ir a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    placeholder="••••••••"
                    maxLength={128}
                    autoComplete="new-password"
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

                {password.length > 0 && passwordErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordErrors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" /> {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    maxLength={128}
                    autoComplete="new-password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || passwordErrors.length > 0}
                className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Actualizando..." : "Restablecer contraseña"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
