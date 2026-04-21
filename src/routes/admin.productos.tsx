import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAllProductsAdmin, resolveProductImage, type DbProduct } from "@/hooks/useProducts";
import { categoryLabels, type Category } from "@/data/products";
import { Plus, Pencil, Trash2, X, Upload, Loader2, AlertTriangle, ArrowLeft, Package } from "lucide-react";
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
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().min(5).max(500),
  price: z.number().min(0).max(1000000),
  stock: z.number().int().min(0).max(10000),
  category: z.string().min(1),
  image: z.string().min(1, "Imagen requerida"),
  active: z.boolean(),
});

type FormState = z.infer<typeof productSchema>;

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

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar definitivamente "${name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert("Error al eliminar: " + error.message);
    else refetch();
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Volver">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Gestión de Productos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} productos en el catálogo</p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="btn-primary inline-flex items-center gap-2 text-sm py-2.5 px-4"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nuevo producto</span><span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          maxLength={100}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">Todas categorías</option>
          {Object.entries(categoryLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {prodLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map(p => (
            <div key={p.id} className={`bg-card rounded-2xl border overflow-hidden shadow-sm transition-all ${p.active ? "border-border/50" : "border-destructive/30 opacity-60"}`}>
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={resolveProductImage(p.image)}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                {!p.active && (
                  <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">INACTIVO</span>
                )}
                <span className="absolute top-2 right-2 bg-card/90 backdrop-blur text-[10px] px-2 py-0.5 rounded-full font-mono">#{p.id}</span>
              </div>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{categoryLabels[p.category as Category] || p.category}</p>
                <h3 className="font-medium text-sm text-foreground line-clamp-1">{p.name}</h3>
                <div className="flex items-center justify-between mt-2 mb-2">
                  <span className="font-bold text-primary">${Number(p.price).toLocaleString("es-MX")}</span>
                  <span className={`text-xs ${p.stock > 0 ? "text-muted-foreground" : "text-destructive font-semibold"}`}>
                    Stock: {p.stock}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => { setEditing(p); setFormOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
                  >
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="flex items-center justify-center text-xs py-2 px-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-colors"
                    aria-label={`Eliminar ${p.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {formOpen && (
          <ProductForm
            initial={editing}
            onClose={() => { setFormOpen(false); setEditing(null); }}
            onSaved={() => { setFormOpen(false); setEditing(null); refetch(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductForm({ initial, onClose, onSaved }: { initial: DbProduct | null; onClose: () => void; onSaved: () => void }) {
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
      setForm(f => ({ ...f, image: pub.publicUrl }));
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
      } else {
        const { error } = await supabase.from("products").insert({
          id: form.id, name: form.name, description: form.description,
          price: form.price, stock: form.stock,
          category: form.category, image: form.image, active: form.active,
        });
        if (error) throw error;
      }
      onSaved();
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
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        className="bg-card w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[95vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border/50 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-heading text-xl font-bold text-foreground">
            {isEdit ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors" aria-label="Cerrar">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">ID único <span className="text-muted-foreground">(ej: ramo-rosas-premium)</span></label>
              <input
                type="text"
                value={form.id}
                onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                maxLength={50}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              maxLength={150} required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} maxLength={500} required
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Precio (MXN)</label>
              <input
                type="number" min="0" step="1"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Stock</label>
              <input
                type="number" min="0" step="1"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Categoría</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {Object.entries(categoryLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Imagen del producto</label>
            <div className="flex gap-3 items-start">
              <div className="relative h-24 w-24 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                {form.image ? (
                  <img src={resolveProductImage(form.image)} alt="" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 cursor-pointer transition-colors text-sm">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>{uploading ? "Subiendo..." : "Subir imagen"}</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                    disabled={uploading} />
                </label>
                <input
                  type="url"
                  placeholder="O pega una URL de imagen"
                  value={form.image}
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
            />
            <span className="text-sm text-foreground">Producto activo (visible en catálogo)</span>
          </label>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving || uploading}
              className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : isEdit ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
