import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Redirige al usuario a /auth/mfa cuando tiene 2FA configurado pero
 * aún no ha completado el segundo factor (AAL2 requerido).
 * Permite navegar libremente a /auth, /auth/mfa y /reset-password
 * para no bloquear el flujo de autenticación.
 */
export default function MfaGuard() {
  const { mfaRequired, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    if (!mfaRequired) return;
    const path = location.pathname;
    const allowed = path === "/auth/mfa" || path === "/auth" || path === "/reset-password";
    if (!allowed) {
      navigate({ to: "/auth/mfa", replace: true });
    }
  }, [mfaRequired, user, loading, location.pathname, navigate]);

  return null;
}
