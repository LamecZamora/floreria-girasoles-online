import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, MessageSquare, Loader2, CheckCircle2, CalendarDays, Info } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CheckoutDialog = ({ open, onClose }: Props) => {
  const { items, total, clearCart, setIsOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split("T")[0];
  }, []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Inicia sesión para realizar tu pedido");
      onClose();
      setIsOpen(false);
      navigate({ to: "/auth" });
      return;
    }
    if (address.trim().length < 8) {
      toast.error("Ingresa una dirección válida");
      return;
    }
    if (!deliveryDate || deliveryDate < minDate) {
      toast.error("Los pedidos deben hacerse con al menos 10 días de anticipación");
      return;
    }
    setSubmitting(true);

    // Capture cart snapshot BEFORE clearing (for WhatsApp message)
    const cartSnapshot = items.map(i => ({
      name: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
      subtotal: i.product.price * i.quantity,
    }));
    const totalSnapshot = total;

    // Send only product_id + quantity. The server (create_order RPC)
    // looks up authoritative prices and computes the total.
    const orderItems = items.map(i => ({
      id: i.product.id,
      quantity: i.quantity,
    }));

    const { data: orderId, error } = await supabase.rpc("create_order", {
      _items: orderItems,
      _delivery_address: address.trim(),
      _delivery_date: deliveryDate,
      _notes: notes.trim() || undefined,
    });

    setSubmitting(false);
    if (error) {
      console.error("create_order error:", error);
      const raw = error.message || "";
      const stockMatch = raw.match(/Insufficient stock for ([^:]+): only (\d+) available/);
      const unavailableMatch = raw.match(/Product not available: (.+)/);
      const msg = raw.includes("Authentication")
        ? "Tu sesión expiró. Inicia sesión de nuevo."
        : raw.includes("Invalid delivery")
        ? "La dirección de entrega no es válida."
        : raw.includes("Cart is empty")
        ? "Tu carrito está vacío."
        : stockMatch
        ? `Sin stock suficiente de "${stockMatch[1].trim()}". Solo quedan ${stockMatch[2]} disponibles.`
        : unavailableMatch
        ? `"${unavailableMatch[1].trim()}" ya no está disponible.`
        : raw.includes("Unknown product")
        ? "Uno de los productos ya no existe. Actualiza la página."
        : "No se pudo crear el pedido. Intenta de nuevo.";
      toast.error(msg);
      return;
    }

    // Build WhatsApp message and open wa.me
    const orderRef = typeof orderId === "string" ? orderId.slice(0, 8).toUpperCase() : "NUEVO";
    const itemsText = cartSnapshot
      .map(i => `• ${i.quantity}x ${i.name} — $${i.subtotal.toLocaleString("es-MX")}`)
      .join("\n");
    const customerName = user.user_metadata?.full_name || user.email || "Cliente";
    const message =
      `🌻 *NUEVO PEDIDO #${orderRef}*\n\n` +
      `👤 *Cliente:* ${customerName}\n` +
      `📧 *Email:* ${user.email}\n\n` +
      `📦 *Productos:*\n${itemsText}\n\n` +
      `💰 *Total: $${totalSnapshot.toLocaleString("es-MX")} MXN*\n\n` +
      `📍 *Dirección de entrega:*\n${address.trim()}` +
      (notes.trim() ? `\n\n📝 *Notas:*\n${notes.trim()}` : "");

    const FLORERIA_WHATSAPP = "5216181169706"; // +52 618 116 9706
    const waUrl = `https://wa.me/${FLORERIA_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    setSuccess(true);
    clearCart();
    setTimeout(() => {
      setSuccess(false);
      setAddress("");
      setNotes("");
      onClose();
      setIsOpen(false);
      navigate({ to: "/pedidos" });
    }, 1600);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[oklch(0.15_0.02_50/0.6)] backdrop-blur-sm"
            onClick={() => !submitting && onClose()}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-card rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
          >
            {success ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-10 text-center flex flex-col items-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-12 w-12 text-success" />
                </motion.div>
                <h3 className="font-heading text-2xl font-bold text-foreground">¡Pedido confirmado!</h3>
                <p className="text-muted-foreground text-sm">Te llevamos a tus pedidos…</p>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h3 className="font-heading text-xl font-bold text-foreground">Confirmar pedido</h3>
                  <button
                    onClick={onClose}
                    disabled={submitting}
                    className="p-2 rounded-lg hover:bg-muted transition disabled:opacity-50"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Productos</span>
                      <span className="font-medium text-foreground">{items.length}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-border/40">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary font-heading text-lg">${total.toLocaleString("es-MX")} MXN</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
                      <MapPin className="h-4 w-4 text-primary" /> Dirección de entrega
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value.slice(0, 300))}
                      required
                      rows={2}
                      placeholder="Calle, número, colonia, referencia…"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-1.5">
                      <MessageSquare className="h-4 w-4 text-primary" /> Notas (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                      rows={2}
                      placeholder="Ej. Tarjeta con dedicatoria, hora de entrega…"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3.5 disabled:opacity-60"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>
                    ) : (
                      <>Confirmar pedido</>
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutDialog;
