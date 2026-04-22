import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAllProductsAdmin, resolveProductImage, type DbProduct } from "@/hooks/useProducts";
import { categoryLabels, type Category } from "@/data/products";
import {
  Plus, Pencil, Trash2, X, Upload, Loader2, AlertTriangle, ArrowLeft, Package,
  Eye, EyeOff, Search, ArrowUpDown, CheckCircle2, PackageX, RotateCcw, ImagePlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

export const Route = createFileRoute("/admin/productos")({
  component: AdminProductosPage,
  head: () => ({
    meta: [
      { title: "Gestión de Productos - Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const productSchema = z.object({
  id: z.string().trim().min(1, "ID requerido").max(50, "Máx 50 caracteres").regex(/^[a-z0-9-]+$/i, "Solo letras, números y guiones"),
  name: z.string().trim().min(2, "Nombre muy corto").max(150, "Máx 150 caracteres"),
  description: z.string().trim().min(5, "Descripción muy corta").max(500, "Máx 500 caracteres"),
  price: z.number().min(0, "Precio inválido").max(1000000, "Precio muy alto"),
  stock: z.number().int().min(0, "Stock inválido").max(10000, "Stock muy alto"),
  category: z.string().min(1, "Categoría requerida"),
  image: z.string().min(1, "Imagen requerida"),
  active: z.boolean(),
});

type FormState = z.infer<typeof productSchema>;
type SortKey = "recent" | "name" | "price-asc" | "price-desc" | "stock";

const empty: FormState = {
  id: "",
  name: "",
  description: "",
  price: 0,
  stock: 0,
  category: "14-febrero",
  image: "",
  active: true,
};

function AdminProductosPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { products, loading: prodLoading, refetch } = useAllProductsAdmin();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "no-stock">("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [confirmDelete, setConfirmDelete] = useState<DbProduct | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.active).length,
    inactive: products.filter((p) => !p.active).length,
    noStock: products.filter((p) => p.stock === 0).length,
  }), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchCat = filterCat === "all" || p.category === filterCat;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && p.active) ||
        (filterStatus === "inactive" && !p.active) ||
        (filterStatus === "no-stock" && p.stock === 0);
      return matchSearch && matchCat && matchStatus;
    });
    switch (sort) {
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
        break;
      case "price-asc":
        list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "stock":
        list = [...list].sort((a, b) => a.stock - b.stock);
        break;
      default:
        break;
    }
    return list;
  }, [products, search, filterCat, filterStatus, sort]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Cargando" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold">Acceso denegado</h1>
          <p className="text-muted-foreground mt-2 text-sm">Necesitas permisos de administrador.</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const toggleActive = async (p: DbProduct) => {
    setBusyProductId(p.id);
    try {
      const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
      if (error) throw error;
      setToast(`"${p.name}" ${!p.active ? "activado" : "desactivado"}`);
      refetch();
    } catch (err) {
      setToast("Error: " + (err instanceof Error ? err.message : "No se pudo actualizar"));
    } finally {
      setBusyProductId(null);
    }
  };

  const markOutOfStock = async (p: DbProduct) => {
    setBusyProductId(p.id);
    try {
      const { error } = await supabase.from("products").update({ stock: 0 }).eq("id", p.id);
      if (error) throw error;
      setToast(`"${p.name}" marcado sin stock`);
      refetch();
    } catch (err) {
      setToast("Error: " + (err instanceof Error ? err.message : "No se pudo actualizar"));
    } finally {
      setBusyProductId(null);
    }
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    setBusyProductId(confirmDelete.id);
    try {
      const { error } = await supabase.from("products").delete().eq("id", confirmDelete.id);
      if (error) throw error;
      setToast(`"${confirmDelete.name}" eliminado`);
      refetch();
    } catch (err) {
      setToast("Error al eliminar: " + (err instanceof Error ? err.message : "No se pudo eliminar"));
    } finally {
      setBusyProductId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-5">
        <Link
          to="/admin"
          className="p-2 rounded-xl hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Volver al panel admin"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-xl sm:text-3xl font-bold text-foreground truncate">
            Gestión de Productos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {stats.total} productos · {stats.active} activos · {stats.inactive} inactivos
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-3 sm:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Crear nuevo producto"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo producto</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Stats chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <StatChip
          label="Total" value={stats.total}
          active={filterStatus === "all"}
          onClick={() => setFilterStatus("all")}
          tone="muted"
        />
        <StatChip
          label="Activos" value={stats.active}
          active={filterStatus === "active"}
          onClick={() => setFilterStatus("active")}
          tone="success"
        />
        <StatChip
          label="Inactivos" value={stats.inactive}
          active={filterStatus === "inactive"}
          onClick={() => setFilterStatus("inactive")}
          tone="warning"
        />
        <StatChip
          label="Sin stock" value={stats.noStock}
          active={filterStatus === "no-stock"}
          onClick={() => setFilterStatus("no-stock")}
          tone="destructive"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            aria-label="Buscar productos"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          aria-label="Filtrar por categoría"
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <option value="all">Todas categorías</option>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Ordenar productos"
            className="pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <option value="recent">Más recientes</option>
            <option value="name">Nombre A-Z</option>
            <option value="price-asc">Precio menor</option>
            <option value="price-desc">Precio mayor</option>
            <option value="stock">Stock menor</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      {prodLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Cargando productos" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No se encontraron productos</p>
          {(search || filterCat !== "all" || filterStatus !== "all") && (
            <button
              onClick={() => { setSearch(""); setFilterCat("all"); setFilterStatus("all"); }}
              className="mt-4 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {filtered.map((p) => (
            <article
              key={p.id}
              className={`bg-card rounded-2xl border overflow-hidden shadow-sm transition-all hover:shadow-md ${
                p.active ? "border-border/50" : "border-warning/30 opacity-70"
              }`}
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={resolveProductImage(p.image)}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                {!p.active && (
                  <span className="absolute top-2 left-2 bg-warning text-warning-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                    INACTIVO
                  </span>
                )}
                {p.stock === 0 && p.active && (
                  <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                    SIN STOCK
                  </span>
                )}
                <span className="absolute top-2 right-2 bg-card/90 backdrop-blur text-[10px] px-2 py-0.5 rounded-full font-mono max-w-[60%] truncate">
                  #{p.id}
                </span>
              </div>
              <div className="p-2.5 sm:p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5 truncate">
                  {categoryLabels[p.category as Category] || p.category}
                </p>
                <h3 className="font-medium text-sm text-foreground line-clamp-1" title={p.name}>
                  {p.name}
                </h3>
                <div className="flex items-center justify-between mt-2 mb-2 gap-2">
                  <span className="font-bold text-primary text-sm sm:text-base">
                    ${Number(p.price).toLocaleString("es-MX")}
                  </span>
                  <span className={`text-xs whitespace-nowrap ${p.stock > 0 ? "text-muted-foreground" : "text-destructive font-semibold"}`}>
                    Stock: {p.stock}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setEditing(p); setFormOpen(true); }}
                    disabled={busyProductId === p.id}
                    className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Editar ${p.name}`}
                  >
                    <Pencil className="h-3 w-3" /> <span className="hidden xs:inline">Editar</span>
                  </button>
                  {p.active && p.stock > 0 && (
                    <button
                      onClick={() => markOutOfStock(p)}
                      disabled={busyProductId === p.id}
                      className="flex items-center justify-center text-xs py-2 px-2.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Marcar ${p.name} sin stock`}
                      title="Marcar sin stock"
                    >
                      {busyProductId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageX className="h-3 w-3" />}
                    </button>
                  )}
                  {p.active ? (
                    <button
                      onClick={() => toggleActive(p)}
                      disabled={busyProductId === p.id}
                      className="flex items-center justify-center text-xs py-2 px-2.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Deshabilitar ${p.name}`}
                      title="Deshabilitar (se conserva la imagen, se puede restaurar)"
                    >
                      {busyProductId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleActive(p)}
                        disabled={busyProductId === p.id}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-2 px-2.5 rounded-lg bg-success/10 text-success hover:bg-success/20 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Restaurar ${p.name}`}
                        title="Restaurar producto"
                      >
                        {busyProductId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RotateCcw className="h-3 w-3" /> <span className="hidden xs:inline">Restaurar</span></>}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p)}
                        disabled={busyProductId === p.id}
                        className="flex items-center justify-center text-xs py-2 px-2.5 rounded-lg bg-destructive/15 text-destructive hover:bg-destructive/25 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Eliminar ${p.name} definitivamente`}
                        title="Eliminar definitivamente"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {formOpen && (
          <ProductForm
            initial={editing}
            onClose={() => { setFormOpen(false); setEditing(null); }}
            onSaved={(msg) => {
              setFormOpen(false);
              setEditing(null);
              refetch();
              setToast(msg);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog
            title="Eliminar producto"
            description={`¿Eliminar definitivamente "${confirmDelete.name}"? Esta acción no se puede deshacer.`}
            confirmLabel="Sí, eliminar"
            onConfirm={performDelete}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-foreground text-background px-4 py-2.5 rounded-xl shadow-lg text-sm flex items-center gap-2 max-w-[92vw]"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatChip({
  label, value, active, onClick, tone,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
  tone: "muted" | "success" | "warning" | "destructive";
}) {
  const tones: Record<typeof tone, string> = {
    muted: "bg-card border-border/50 text-foreground hover:bg-muted/40",
    success: "bg-success/5 border-success/30 text-success hover:bg-success/10",
    warning: "bg-warning/5 border-warning/30 text-warning hover:bg-warning/10",
    destructive: "bg-destructive/5 border-destructive/30 text-destructive hover:bg-destructive/10",
  };
  const activeRing: Record<typeof tone, string> = {
    muted: "ring-2 ring-foreground/20",
    success: "ring-2 ring-success/40",
    warning: "ring-2 ring-warning/40",
    destructive: "ring-2 ring-destructive/40",
  };
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`text-left px-3 py-2.5 rounded-xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${tones[tone]} ${active ? activeRing[tone] : ""}`}
    >
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-lg sm:text-xl font-bold leading-tight">{value}</p>
    </button>
  );
}

function ConfirmDialog({
  title, description, confirmLabel, onConfirm, onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card w-full max-w-sm rounded-2xl shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-title" className="font-heading text-lg font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted/40 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProductForm({
  initial, onClose, onSaved,
}: {
  initial: DbProduct | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState<FormState>(initial ? {
    id: initial.id,
    name: initial.name,
    description: initial.description,
    price: Number(initial.price),
    stock: initial.stock,
    category: initial.category,
    image: initial.image,
    active: initial.active,
  } : empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const isEdit = !!initial;

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image: pub.publicUrl }));
    } catch (err) {
      setError("Error al subir: " + (err instanceof Error ? err.message : "desconocido"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = productSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const { error } = await supabase.from("products")
          .update({
            name: form.name, description: form.description,
            price: form.price, stock: form.stock,
            category: form.category, image: form.image, active: form.active,
          })
          .eq("id", initial!.id);
        if (error) throw error;
        onSaved(`"${form.name}" actualizado`);
      } else {
        const { error } = await supabase.from("products").insert({
          id: form.id, name: form.name, description: form.description,
          price: form.price, stock: form.stock,
          category: form.category, image: form.image, active: form.active,
        });
        if (error) throw error;
        onSaved(`"${form.name}" creado`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        className="bg-card w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[95vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border/50 px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between z-10">
          <h2 id="product-form-title" className="font-heading text-lg sm:text-xl font-bold text-foreground">
            {isEdit ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Cerrar formulario"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {!isEdit && (
            <div>
              <label htmlFor="prod-id" className="block text-xs font-medium text-foreground mb-1.5">
                ID único <span className="text-muted-foreground">(ej: ramo-rosas-premium)</span>
              </label>
              <input
                id="prod-id"
                type="text"
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                maxLength={50}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
          )}

          <div>
            <label htmlFor="prod-name" className="block text-xs font-medium text-foreground mb-1.5">Nombre</label>
            <input
              id="prod-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={150} required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>

          <div>
            <label htmlFor="prod-desc" className="block text-xs font-medium text-foreground mb-1.5">
              Descripción
              <span className="text-muted-foreground ml-1">({form.description.length}/500)</span>
            </label>
            <textarea
              id="prod-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} maxLength={500} required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="prod-price" className="block text-xs font-medium text-foreground mb-1.5">Precio (MXN)</label>
              <input
                id="prod-price"
                type="number" min="0" step="1" inputMode="numeric"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
            <div>
              <label htmlFor="prod-stock" className="block text-xs font-medium text-foreground mb-1.5">Stock</label>
              <input
                id="prod-stock"
                type="number" min="0" step="1" inputMode="numeric"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-cat" className="block text-xs font-medium text-foreground mb-1.5">Categoría</label>
            <select
              id="prod-cat"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {Object.entries(categoryLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-medium text-foreground mb-1.5">
              Imagen del producto
              {isEdit && form.image && (
                <span className="text-muted-foreground ml-1 font-normal">· se conserva si no subes otra</span>
              )}
            </span>
            <div className="flex gap-3 items-start">
              <div className="relative h-24 w-24 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-border/50">
                {form.image ? (
                  <img
                    src={resolveProductImage(form.image)} alt="Vista previa"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 cursor-pointer transition-colors text-sm focus-within:ring-2 focus-within:ring-primary/40">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  <span>{uploading ? "Subiendo..." : isEdit && form.image ? "Cambiar imagen" : "Subir imagen"}</span>
                  <input
                    type="file" accept="image/*" className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                    disabled={uploading}
                    aria-label="Seleccionar imagen del producto"
                  />
                </label>
                <p className="text-[10px] text-muted-foreground">Máx 5MB · JPG, PNG, WEBP</p>
                <button
                  type="button"
                  onClick={() => setShowUrlInput((v) => !v)}
                  className="text-[10px] text-muted-foreground hover:text-primary underline underline-offset-2"
                >
                  {showUrlInput ? "Ocultar URL externa" : "¿Prefieres pegar una URL?"}
                </button>
                {showUrlInput && (
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    aria-label="URL de imagen"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                )}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
            />
            <span className="text-sm text-foreground">Producto activo (visible en catálogo)</span>
          </label>

          {error && (
            <div
              className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm flex items-center gap-2"
              role="alert"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-card -mx-4 sm:-mx-5 px-4 sm:px-5 pb-1 pt-3 border-t border-border/50">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving || uploading}
              className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : isEdit ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
