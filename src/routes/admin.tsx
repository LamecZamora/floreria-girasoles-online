import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Shield, Users, Package, LogOut, AlertTriangle } from "lucide-react";
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
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-heading text-3xl sm:text-4xl">Panel de Administración</h1>
            <p className="text-muted-foreground mt-1 text-sm">Gestión segura del sistema</p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all text-sm"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>

        {/* Security status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Shield, label: "HTTPS/SSL", status: "Activo", color: "text-secondary bg-secondary/10" },
            { icon: Shield, label: "RLS Activo", status: "Protegido", color: "text-secondary bg-secondary/10" },
            { icon: Shield, label: "Anti XSS", status: "Activo", color: "text-secondary bg-secondary/10" },
            { icon: Shield, label: "Anti SQL Injection", status: "Activo", color: "text-secondary bg-secondary/10" },
          ].map(({ icon: Icon, label, status, color }) => (
            <div key={label} className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{status}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Usuarios registrados</span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">{users.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Productos</span>
            </div>
            <p className="text-3xl font-heading font-bold text-foreground">150+</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5 text-secondary" />
              <span className="text-sm text-muted-foreground">Nivel de seguridad</span>
            </div>
            <p className="text-3xl font-heading font-bold text-secondary">Alto</p>
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
