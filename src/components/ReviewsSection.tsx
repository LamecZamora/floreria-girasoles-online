import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Loader2, Camera, Send, X, MessageSquareHeart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  image_url: string | null;
  created_at: string;
}

const StarRow = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type={onChange ? "button" : undefined}
        onClick={onChange ? () => onChange(n) : undefined}
        disabled={!onChange}
        aria-label={`${n} estrellas`}
        className={onChange ? "cursor-pointer transition-transform hover:scale-110" : ""}
      >
        <Star
          className={`h-5 w-5 ${n <= value ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
        />
      </button>
    ))}
  </div>
);

const ReviewsSection = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id, customer_name, rating, comment, image_url, created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(12);
    setReviews(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Realtime
    const ch = supabase
      .channel("reviews:public")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  // Verifica si el usuario tiene un pedido entregado
  useEffect(() => {
    (async () => {
      if (!user) { setCanReview(false); return; }
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "entregado");
      setCanReview((count ?? 0) > 0);
    })();
  }, [user]);

  const handleFile = (f: File | null) => {
    if (!f) { setFile(null); setFilePreview(null); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("La imagen debe pesar menos de 5MB"); return; }
    if (!f.type.startsWith("image/")) { toast.error("Selecciona una imagen válida"); return; }
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (comment.trim().length < 5) { toast.error("Escribe un comentario más largo"); return; }
    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("review-images").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("review-images").getPublicUrl(path);
        image_url = pub.publicUrl;
      }
      const customer_name =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] || "Cliente";
      const { error: insErr } = await supabase.from("reviews").insert({
        user_id: user.id,
        customer_name,
        rating,
        comment: comment.trim(),
        image_url,
      });
      if (insErr) throw insErr;
      toast.success("¡Gracias por tu reseña! 🌻");
      setShowForm(false);
      setComment(""); setRating(5); setFile(null); setFilePreview(null);
    } catch (err: any) {
      toast.error(err.message || "No se pudo enviar la reseña");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-px w-8 bg-primary/40" />
          <MessageSquareHeart className="h-4 w-4 text-primary" />
          <span className="text-primary font-medium text-xs uppercase tracking-[0.25em]">Lo que dicen</span>
          <div className="h-px w-8 bg-primary/40" />
        </div>
        <h2 className="section-heading text-3xl sm:text-4xl md:text-5xl">Reseñas de nuestros clientes</h2>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-lg mx-auto">
          Historias reales de quienes ya recibieron un arreglo Girasoles en casa.
        </p>

        {user && canReview && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary mt-6 inline-flex">
            <Send className="h-4 w-4" /> Dejar una reseña
          </button>
        )}
        {user && !canReview && (
          <p className="mt-4 text-xs text-muted-foreground italic">
            Podrás dejar una reseña cuando tu primer pedido sea marcado como entregado.
          </p>
        )}
      </div>

      {showForm && (
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto bg-card rounded-2xl border border-border p-5 sm:p-6 mb-10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold">Tu reseña</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Calificación</label>
            <StarRow value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Comentario</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 1000))}
              rows={4}
              required
              minLength={5}
              maxLength={1000}
              placeholder="Cuéntanos sobre tu experiencia y tu arreglo…"
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{comment.length}/1000</p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Foto del arreglo (opcional)</label>
            {filePreview ? (
              <div className="relative inline-block">
                <img src={filePreview} alt="" className="h-28 w-28 object-cover rounded-xl border border-border" />
                <button
                  type="button"
                  onClick={() => handleFile(null)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border hover:border-primary cursor-pointer text-sm transition">
                <Camera className="h-4 w-4 text-primary" />
                <span>Subir foto</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <><Send className="h-4 w-4" /> Publicar</>}
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Aún no hay reseñas. ¡Sé el primero!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <motion.article
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col"
            >
              {r.image_url && (
                <img
                  src={r.image_url}
                  alt={`Arreglo entregado a ${r.customer_name}`}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              )}
              <div className="p-5 flex-1 flex flex-col">
                <StarRow value={r.rating} />
                <p className="text-sm text-foreground mt-3 flex-1 leading-relaxed">"{r.comment}"</p>
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="font-medium text-sm text-foreground">{r.customer_name}</span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
};

export default ReviewsSection;
