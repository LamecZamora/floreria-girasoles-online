import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, AlertTriangle, Loader2, Flower2, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/auth/mfa")({
  component: MfaChallengePage,
  head: () => ({
    meta: [
      { title: "Verificación 2FA - Florería Girasoles" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function MfaChallengePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      // If already at AAL2, no challenge needed
      if (aalData?.currentLevel === aalData?.nextLevel) {
        navigate({ to: "/" });
        return;
      }
      const { data: factorsData, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) {
        setError(fErr.message);
        setChecking(false);
        return;
      }
      const verified = factorsData?.totp?.find((f) => f.status === "verified");
      if (!verified) {
        // No factor enrolled — shouldn't be here
        navigate({ to: "/" });
        return;
      }
      setFactorId(verified.id);
      setChecking(false);
    };
    init();
  }, [user, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;
      navigate({ to: "/" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Código inválido");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 dots-pattern opacity-20" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-primary/8 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
              <Flower2 className="h-5 w-5 text-primary" />
            </div>
            <span className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
              Florería <span className="text-primary">Girasoles</span>
            </span>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border/40 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="mx-auto h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
              <ShieldCheck className="h-7 w-7 text-secondary" />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Verificación 2FA</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Ingresa el código de 6 dígitos de tu app autenticadora
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-3xl tracking-[0.5em] font-mono"
              autoComplete="one-time-code"
              autoFocus
            />

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verificar
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" /> Cancelar y cerrar sesión
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
