import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, User, AlertTriangle, Flower2, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import CaptchaChallenge, { type CaptchaHandle } from "@/components/CaptchaChallenge";
import { lovable } from "@/integrations/lovable";


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

type Mode = "login" | "signup" | "forgot";

// Password strength helpers (computed cheaply on each render — inputs are short)
function computePasswordChecks(pwd: string) {
  return [
    { label: "8+ caracteres", ok: pwd.length >= 8 },
    { label: "Mayúscula", ok: /[A-Z]/.test(pwd) },
    { label: "Minúscula", ok: /[a-z]/.test(pwd) },
    { label: "Número", ok: /[0-9]/.test(pwd) },
    { label: "Símbolo", ok: /[^A-Za-z0-9]/.test(pwd) },
  ];
}

function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const resetCaptcha = useCallback(() => {
    captchaRef.current?.refresh();
    setCaptchaVerified(false);
  }, []);

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  const switchMode = useCallback((next: Mode) => {
    setMode(next);
    setError("");
    setSuccess("");
    resetCaptcha();
  }, [resetCaptcha]);

  const signInWithGoogle = useCallback(async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError(translateAuthError(result.error instanceof Error ? result.error.message : String(result.error)));
      } else if (result.redirected) {
        // Browser will redirect to Google — nothing more to do
        return;
      }
    } catch (e) {
      setError("Error al iniciar sesión con Google. Intenta de nuevo.");
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  if (user) return null;

  const passwordChecks = computePasswordChecks(password);
  const passwordStrength = passwordChecks.filter(c => c.ok).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!captchaVerified) {
      setError("Completa la verificación de seguridad");
      return;
    }

    setLoading(true);
    let hadError = false;
    try {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        setError(emailResult.error.errors[0].message);
        hadError = true;
        return;
      }

      if (isLogin) {
        const { error, mfaRequired } = await signIn(email.trim(), password);
        if (error) { setError(translateAuthError(error)); hadError = true; }
        else if (mfaRequired) navigate({ to: "/auth/mfa" });
        else navigate({ to: "/" });
      } else if (isForgot) {
        const { error } = await resetPassword(email.trim());
        if (error) { setError(translateAuthError(error)); hadError = true; }
        else setSuccess("Si el email existe, recibirás un enlace para restablecer tu contraseña.");
      } else {
        const nameResult = nameSchema.safeParse(fullName);
        if (!nameResult.success) {
          setError(nameResult.error.errors[0].message);
          hadError = true;
          return;
        }
        const pwdResult = passwordSchema.safeParse(password);
        if (!pwdResult.success) {
          setError(pwdResult.error.errors[0].message);
          hadError = true;
          return;
        }
        const { error } = await signUp(email.trim(), password, fullName.trim());
        if (error) { setError(translateAuthError(error)); hadError = true; }
        else setSuccess("¡Cuenta creada! Revisa tu email para confirmar tu cuenta.");
      }
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
      hadError = true;
    } finally {
      setLoading(false);
      if (hadError) resetCaptcha();
    }
  };

  const titles: Record<Mode, { title: string; subtitle: string }> = {
    login: { title: "Bienvenido de vuelta", subtitle: "Inicia sesión para continuar 🌻" },
    signup: { title: "Crea tu cuenta", subtitle: "Únete a Florería Girasoles" },
    forgot: { title: "Recupera tu cuenta", subtitle: "Te enviaremos un enlace por email" },
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Decorative background */}
      <div aria-hidden className="absolute inset-0 dots-pattern opacity-20" />
      <div aria-hidden className="absolute -top-20 -right-20 w-[28rem] h-[28rem] bg-primary/10 rounded-full blur-[100px]" />
      <div aria-hidden className="absolute -bottom-20 -left-20 w-[24rem] h-[24rem] bg-accent/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group" aria-label="Volver al inicio">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-105 transition-all">
              <Flower2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <span className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              Florería <span className="text-primary">Girasoles</span>
            </span>
          </Link>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-4 sm:mt-5"
            >
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                {titles[mode].title}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {titles[mode].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card */}
        <div className="bg-card/90 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl border border-border/50 p-5 sm:p-7">
          {/* Tabs (only login/signup) */}
          {!isForgot && (
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/60 mb-5">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  isSignup ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Crear cuenta
              </button>
            </div>
          )}

          {/* Google Sign In */}
          {!isForgot && (
            <>
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium text-foreground">
                  {googleLoading ? "Conectando..." : "Continuar con Google"}
                </span>
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">o</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AnimatePresence initial={false}>
              {isSignup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <FieldLabel>Nombre completo</FieldLabel>
                  <InputWrap icon={<User className="h-4 w-4" />}>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre"
                      maxLength={100}
                      autoComplete="name"
                      required
                      className="auth-input"
                    />
                  </InputWrap>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <FieldLabel>Email</FieldLabel>
              <InputWrap icon={<Mail className="h-4 w-4" />}>
                <input
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  maxLength={255}
                  autoComplete="email"
                  required
                  className="auth-input"
                />
              </InputWrap>
            </div>

            <AnimatePresence initial={false}>
              {!isForgot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <FieldLabel className="!mb-0">Contraseña</FieldLabel>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <InputWrap icon={<Lock className="h-4 w-4" />}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      maxLength={128}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      className="auth-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </InputWrap>

                  {isSignup && password.length > 0 && (
                    <div className="mt-2.5">
                      {/* Strength bar */}
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= passwordStrength
                                ? passwordStrength <= 2
                                  ? "bg-destructive"
                                  : passwordStrength <= 3
                                  ? "bg-warning"
                                  : "bg-success"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        {passwordChecks.map((c) => (
                          <p
                            key={c.label}
                            className={`text-[11px] flex items-center gap-1 ${
                              c.ok ? "text-success" : "text-muted-foreground"
                            }`}
                          >
                            <CheckCircle2
                              className={`h-3 w-3 flex-shrink-0 ${c.ok ? "opacity-100" : "opacity-40"}`}
                            />
                            {c.label}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <CaptchaChallenge ref={captchaRef} onVerified={setCaptchaVerified} />

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-3 py-2.5 text-sm flex items-start gap-2"
                  role="alert"
                >
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-success/10 border border-success/20 text-success rounded-xl px-3 py-2.5 text-sm flex items-start gap-2"
                  role="status"
                >
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !captchaVerified}
              className="w-full btn-primary py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
                </>
              ) : isLogin ? (
                "Iniciar Sesión"
              ) : isForgot ? (
                "Enviar enlace"
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </form>

          {isForgot && (
            <button
              onClick={() => switchMode("login")}
              className="mt-5 w-full inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver a iniciar sesión
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5 px-4">
          Al continuar aceptas nuestros términos y la política de privacidad.
        </p>
      </motion.div>
    </div>
  );
}

const FieldLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <label className={`block text-sm font-medium text-foreground mb-1.5 ${className}`}>{children}</label>
);

const InputWrap = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
      {icon}
    </span>
    {children}
  </div>
);

function translateAuthError(error: string): string {
  if (error.includes("Invalid login credentials")) return "Email o contraseña incorrectos";
  if (error.includes("Email not confirmed")) return "Confirma tu email antes de iniciar sesión";
  if (error.includes("User already registered")) return "Este email ya está registrado";
  if (error.includes("Password should be")) return "La contraseña no cumple los requisitos mínimos";
  if (error.includes("rate limit")) return "Demasiados intentos. Espera un momento.";
  if (error.includes("password")) return "La contraseña ha sido comprometida. Usa otra diferente.";
  return error;
}
