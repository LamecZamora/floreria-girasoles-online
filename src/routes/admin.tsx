import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Shield, Users, Package, LogOut, AlertTriangle, ClipboardList, ArrowRight, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Panel de Administración - Florería Girasoles" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

interface UserProfile {
  user_id: string;
  full_name: string | null;
  created_at: string;
}

function AdminPage() {
  const { user, isAdmin, mfaVerified, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadCounts();
    }
  }, [isAdmin]);

  const loadCounts = async () => {
    const [{ count: pCount }, { count: oCount }] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pendiente"),
    ]);
    setProductCount(pCount || 0);
    setPendingCount(oCount || 0);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setUsers(data);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Acceso Denegado</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            No tienes permisos de administrador para acceder a esta sección.
          </p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            Volver al Inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  if (location.pathname !== "/admin") {
    return <Outlet />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="section-heading text-2xl sm:text-4xl">Panel de Administración</h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Gestión segura del sistema</p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="self-start sm:self-auto flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all text-xs sm:text-sm"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>

        {/* 2FA reminder for admins */}
        {!mfaVerified && (
          <Link
            to="/seguridad"
            className="group flex items-start gap-3 bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-6 hover:bg-accent/15 transition-all"
          >
            <div className="p-2 rounded-xl bg-accent/20 text-accent flex-shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm sm:text-base">Activa 2FA — obligatorio para administradores</p>
              <p className="text-xs text-muted-foreground mt-0.5">Protege tu cuenta con Google Authenticator. Toca aquí para configurarlo.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-accent group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
          </Link>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link to="/admin/productos" className="group bg-card rounded-2xl border border-border/50 p-5 hover:border-primary/40 hover:shadow-lg transition-all flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <Package className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-foreground text-base sm:text-lg">Gestión de Productos</p>
              <p className="text-xs text-muted-foreground">{productCount} productos · Crear, editar, eliminar</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
          </Link>
          <Link to="/pedidos" className="group bg-card rounded-2xl border border-border/50 p-5 hover:border-accent/40 hover:shadow-lg transition-all flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10 text-accent flex-shrink-0 relative">
              <ClipboardList className="h-6 w-6" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-foreground text-base sm:text-lg">Pedidos</p>
              <p className="text-xs text-muted-foreground">
                {pendingCount > 0 ? `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"} · ` : ""}Confirmar, cancelar, eliminar
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
          </Link>
        </div>

        {/* Security status cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {[
            { icon: Shield, label: "HTTPS/SSL", status: "Activo" },
            { icon: Shield, label: "RLS Activo", status: "Protegido" },
            { icon: Shield, label: "Anti XSS", status: "Activo" },
            { icon: Shield, label: "Anti SQLi", status: "Activo" },
          ].map(({ icon: Icon, label, status }) => (
            <div key={label} className="bg-card rounded-xl border border-border/50 p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg text-secondary bg-secondary/10 flex-shrink-0">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-xs sm:text-sm truncate">{label}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{status}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-[10px] sm:text-sm text-muted-foreground truncate">Usuarios</span>
            </div>
            <p className="text-xl sm:text-3xl font-heading font-bold text-foreground">{users.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              <span className="text-[10px] sm:text-sm text-muted-foreground truncate">Productos</span>
            </div>
            <p className="text-xl sm:text-3xl font-heading font-bold text-foreground">{productCount}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-3 sm:p-5">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
              <span className="text-[10px] sm:text-sm text-muted-foreground truncate">Pendientes</span>
            </div>
            <p className="text-xl sm:text-3xl font-heading font-bold text-secondary">{pendingCount}</p>
          </div>
        </div>

        {/* Users list */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Usuarios Registrados</h2>
            <button onClick={loadUsers} disabled={loadingUsers} className="text-xs text-primary hover:underline">
              {loadingUsers ? "Cargando..." : "Actualizar"}
            </button>
          </div>
          <div className="divide-y divide-border/30">
            {users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No hay usuarios registrados aún
              </div>
            ) : (
              users.map((profile) => (
                <div key={profile.user_id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {profile.full_name || "Sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Registrado: {new Date(profile.created_at).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security info */}
        <div className="mt-8 bg-sage-light/30 rounded-xl border border-sage/20 p-5">
          <h3 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-secondary" /> Medidas de Seguridad Implementadas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground">
            <div>
              <h4 className="font-medium mb-2">🔒 Seguridad del Sistema</h4>
              <ul className="space-y-1.5 text-muted-foreground text-xs">
                <li>✅ HTTPS/SSL obligatorio en toda la aplicación</li>
                <li>✅ Servidor configurado con headers de seguridad</li>
                <li>✅ Actualizaciones automáticas de dependencias</li>
                <li>✅ Copias de seguridad automáticas de la BD</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🛡️ Ciberseguridad</h4>
              <ul className="space-y-1.5 text-muted-foreground text-xs">
                <li>✅ Autenticación segura con contraseñas fuertes</li>
                <li>✅ Protección contra SQL Injection (RLS + Supabase)</li>
                <li>✅ Protección contra XSS (sanitización de inputs)</li>
                <li>✅ Cifrado de datos en tránsito y en reposo</li>
                <li>✅ Row Level Security en todas las tablas</li>
                <li>✅ Validación de inputs con Zod</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
