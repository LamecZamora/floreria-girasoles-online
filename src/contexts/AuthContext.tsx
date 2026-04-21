import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; mfaRequired?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);

  const checkMfaStatus = useCallback(async () => {
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const required = data?.nextLevel === "aal2" && data?.currentLevel !== "aal2";
      setMfaRequired(required);
      setMfaVerified(data?.currentLevel === "aal2");
    } catch {
      setMfaRequired(false);
      setMfaVerified(false);
    }
  }, []);

  const checkAdminRole = useCallback(async (userId: string) => {
    // Cache admin role per user_id in sessionStorage to avoid re-querying on
    // every auth state change (e.g. tab focus, token refresh).
    try {
      const cacheKey = `admin_role:${userId}`;
      const cached = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(cacheKey) : null;
      if (cached !== null) {
        setIsAdmin(cached === "1");
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
        return;
      }
      const isAdminUser = !!data;
      setIsAdmin(isAdminUser);
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(cacheKey, isAdminUser ? "1" : "0");
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(() => {
          checkAdminRole(session.user.id);
          checkMfaStatus();
        }, 0);
      } else {
        setIsAdmin(false);
        setMfaRequired(false);
        setMfaVerified(false);
      }
      setLoading(false);
    });

    // THEN check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
        checkMfaStatus();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole, checkMfaStatus]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    // Check if MFA is required after successful password auth
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const required = data?.nextLevel === "aal2" && data?.currentLevel !== "aal2";
      return { error: null, mfaRequired: required };
    } catch {
      return { error: null, mfaRequired: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setMfaRequired(false);
    setMfaVerified(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, mfaRequired, mfaVerified, signUp, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
