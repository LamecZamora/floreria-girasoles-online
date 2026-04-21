import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ShieldCheck, ShieldAlert, Smartphone, KeyRound, Trash2, Loader2, AlertTriangle, ArrowLeft, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/seguridad")({
  component: SecurityPage,
  head: () => ({
    meta: [
      { title: "Seguridad - Florería Girasoles" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

interface MfaFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

function SecurityPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  const verifiedFactor = factors.find((f) => f.status === "verified" && f.factor_type === "totp");
  const has2FA = !!verifiedFactor;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const loadFactors = useCallback(async () => {
    setLoadingFactors(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors((data?.all ?? []) as MfaFactor[]);
    } catch (e) {
      console.error("Error loading factors:", e);
    } finally {
      setLoadingFactors(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadFactors();
  }, [user, loadFactors]);

  const startEnroll = async () => {
    setError("");
    setSuccess("");
    setEnrolling(true);
    try {
      // Clean up unverified factors first
      const unverified = factors.filter((f) => f.status === "unverified");
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${new Date().toLocaleDateString("es-MX")}`,
      });
      if (error) throw error;
      if (data) {
        setEnrollData({
          id: data.id,
          qr: data.totp.qr_code,
          secret: data.totp.secret,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar configuración");
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!enrollData || verifyCode.length !== 6) return;
    setError("");
    setVerifying(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enrollData.id });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (vErr) throw vErr;
      setSuccess("¡2FA activado correctamente! 🎉");
      setEnrollData(null);
      setVerifyCode("");
      await loadFactors();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Código inválido. Intenta de nuevo.");
      setVerifyCode("");
    } finally {
      setVerifying(false);
    }
  };

  const cancelEnroll = async () => {
    if (enrollData) {
      try { await supabase.auth.mfa.unenroll({ factorId: enrollData.id }); } catch {}
    }
    setEnrollData(null);
    setVerifyCode("");
    setError("");
    await loadFactors();
  };

  const removeFactor = async (factorId: string) => {
    if (isAdmin) {
      setError("Los administradores no pueden desactivar 2FA. Es obligatorio por seguridad.");
      return;
    }
    if (!confirm("¿Seguro que deseas desactivar la autenticación de dos factores?")) return;
    setError("");
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setSuccess("2FA desactivado");
      await loadFactors();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al desactivar 2FA");
    }
  };

  const copySecret = async () => {
    if (!enrollData) return;
    await navigator.clipboard.writeText(enrollData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Link to={isAdmin ? "/admin" : "/"} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <div className="flex items-start gap-3 mb-6 sm:mb-8">
          <div className={`p-3 rounded-2xl ${has2FA ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
            {has2FA ? <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" /> : <ShieldAlert className="h-6 w-6 sm:h-7 sm:w-7" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="section-heading text-2xl sm:text-3xl">Seguridad de tu cuenta</h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              {has2FA ? "Tu cuenta está protegida con 2FA." : "Activa la verificación en dos pasos."}
            </p>
          </div>
        </div>

        {isAdmin && !has2FA && (
          <div className="bg-accent/10 border border-accent/30 text-accent-foreground rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-accent" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">2FA obligatorio para administradores</p>
              <p className="text-xs mt-1 text-muted-foreground">Como administrador, debes activar la autenticación de dos factores para proteger las acciones sensibles del sistema.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="bg-secondary/10 text-secondary rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" /> {success}
          </div>
        )}

        {/* Enrollment flow */}
        {enrollData ? (
          <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" /> Configura tu Authenticator
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                1. Abre <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong> o <strong>Authy</strong> en tu celular.
                <br />2. Escanea el código QR o ingresa la clave manualmente.
                <br />3. Escribe el código de 6 dígitos que aparece en tu app.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <div className="bg-background p-3 rounded-xl border-2 border-primary/20 flex-shrink-0 ring-1 ring-foreground/5">
                <img src={enrollData.qr} alt="Código QR para 2FA" className="h-44 w-44 sm:h-52 sm:w-52" />
              </div>
              <div className="flex-1 w-full space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Clave manual</label>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted/50 rounded-lg text-xs font-mono break-all">
                      {enrollData.secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="p-2 rounded-lg border border-border hover:bg-muted/50 transition-all flex-shrink-0"
                      aria-label="Copiar clave"
                    >
                      {copiedSecret ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Código de verificación (6 dígitos)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-2xl tracking-[0.5em] font-mono"
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={verifyEnrollment}
                disabled={verifyCode.length !== 6 || verifying}
                className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Verificar y activar
              </button>
              <button
                onClick={cancelEnroll}
                disabled={verifying}
                className="px-5 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-lg sm:text-xl font-semibold">
                  Autenticación en dos pasos (2FA)
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Añade una capa extra de seguridad usando una app como Google Authenticator.
                </p>
              </div>
            </div>

            {loadingFactors ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : has2FA ? (
              <div className="space-y-3">
                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">2FA activado</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {verifiedFactor?.friendly_name || "Authenticator"} · Activado el{" "}
                      {verifiedFactor?.created_at && new Date(verifiedFactor.created_at).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  {!isAdmin && (
                    <button
                      onClick={() => verifiedFactor && removeFactor(verifiedFactor.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                      title="Desactivar 2FA"
                      aria-label="Desactivar 2FA"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {isAdmin && (
                  <p className="text-xs text-muted-foreground italic">
                    Como administrador, no puedes desactivar 2FA.
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={startEnroll}
                disabled={enrolling}
                className="w-full btn-primary py-3 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Activar autenticación 2FA
              </button>
            )}
          </div>
        )}

        {/* Info card */}
        <div className="mt-6 bg-muted/30 rounded-2xl border border-border/40 p-5">
          <h3 className="font-heading font-semibold text-foreground mb-2 text-sm">¿Qué es 2FA?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            La autenticación en dos factores añade un segundo paso al iniciar sesión: además de tu contraseña,
            necesitarás un código de 6 dígitos que se genera cada 30 segundos en tu celular. Aunque alguien
            descubra tu contraseña, no podrá entrar sin tu dispositivo.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
