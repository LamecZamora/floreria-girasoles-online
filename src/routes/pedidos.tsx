import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, ChevronDown, ChevronUp, ArrowLeft, MessageCircle, Trash2, Check, X as XIcon, Search, Filter } from "lucide-react";
import { OrderStatusBadge, ORDER_STATUS_META, ORDER_STATUSES, type OrderStatus } from "@/components/OrderStatusBadge";

const FLORERIA_WHATSAPP = "5216181169706";

const buildWhatsAppMessage = (order: Order, items: OrderItem[]) => {
  const ref = order.id.slice(0, 8).toUpperCase();
  const itemsText = items
    .map(i => `• ${i.quantity}x ${i.name} — $${(i.price * i.quantity).toLocaleString("es-MX")}`)
    .join("\n");
  return (
    `🌻 *PEDIDO #${ref}*\n\n` +
    (order.user_name ? `👤 *Cliente:* ${order.user_name}\n` : "") +
    `📦 *Productos:*\n${itemsText}\n\n` +
    `💰 *Total: $${Number(order.total).toLocaleString("es-MX")} MXN*\n\n` +
    (order.delivery_address ? `📍 *Dirección:*\n${order.delivery_address}` : "") +
    (order.notes ? `\n\n📝 *Notas:*\n${order.notes}` : "")
  );
};

export const Route = createFileRoute("/pedidos")({
  component: PedidosPage,
  head: () => ({
    meta: [
      { title: "Mis Pedidos - Florería Girasoles" },
      { name: "description", content: "Historial de pedidos en Florería Girasoles" },
    ],
  }),
});

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  notes: string | null;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
}

type DateRange = "all" | "today" | "week" | "month";

function PedidosPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isAdmin]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
        return;
      }

      let enrichedOrders = (data || []).map(d => ({
        ...d,
        items: d.items as unknown as OrderItem[],
      })) as Order[];

      if (isAdmin && enrichedOrders.length > 0) {
        const userIds = [...new Set(enrichedOrders.map(o => o.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        enrichedOrders = enrichedOrders.map(o => ({
          ...o,
          user_name: profileMap.get(o.user_id) || "Cliente",
        }));
      }

      setOrders(enrichedOrders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm("¿Eliminar este pedido permanentemente? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (expandedOrder === orderId) setExpandedOrder(null);
    }
  };

  // Filtrado y búsqueda
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const ranges: Record<DateRange, number> = {
      all: 0,
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = ranges[dateRange];

    return orders.filter(order => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (cutoff > 0 && now - new Date(order.created_at).getTime() > cutoff) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          order.id.toLowerCase().includes(q) ||
          (order.user_name?.toLowerCase().includes(q) ?? false) ||
          (order.delivery_address?.toLowerCase().includes(q) ?? false) ||
          (Array.isArray(order.items) && order.items.some(i => i.name.toLowerCase().includes(q)));
        if (!matches) return false;
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter, dateRange]);

  // Conteos por estado
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    ORDER_STATUSES.forEach(s => { counts[s] = 0; });
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || dateRange !== "all";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="p-2 rounded-xl hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-heading font-bold text-foreground truncate">
              {isAdmin ? "Todos los Pedidos" : "Mis Pedidos"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isAdmin ? "Gestiona los pedidos de clientes" : "Revisa el estado de tus pedidos"}
              {orders.length > 0 && ` · ${orders.length} en total`}
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">No hay pedidos aún</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isAdmin ? "Los pedidos de clientes aparecerán aquí" : "Cuando hagas un pedido, aparecerá aquí"}
            </p>
            <Link to="/catalogo" className="btn-primary">Ver catálogo</Link>
          </div>
        ) : (
          <>
            {/* Barra de búsqueda y filtros */}
            <div className="bg-card rounded-2xl border border-border/50 p-3 sm:p-4 mb-4 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isAdmin ? "Buscar por #, cliente, producto…" : "Buscar por # o producto…"}
                    aria-label="Buscar pedidos"
                    maxLength={100}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(s => !s)}
                  className={`px-3 py-2.5 rounded-xl border text-sm flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                    hasActiveFilters
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                  aria-expanded={showFilters}
                  aria-controls="filters-panel"
                >
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Filtros</span>
                  {hasActiveFilters && (
                    <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                      !
                    </span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div id="filters-panel" className="space-y-3 pt-2 border-t border-border/40">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Estado</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setStatusFilter("all")}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                          statusFilter === "all"
                            ? "bg-foreground text-background border-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Todos ({statusCounts.all})
                      </button>
                      {ORDER_STATUSES.map(s => {
                        const meta = ORDER_STATUS_META[s];
                        const active = statusFilter === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                              active ? meta.chip : "border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {meta.label} ({statusCounts[s] || 0})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Fecha</p>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        { key: "all", label: "Todas" },
                        { key: "today", label: "Hoy" },
                        { key: "week", label: "Última semana" },
                        { key: "month", label: "Último mes" },
                      ] as { key: DateRange; label: string }[]).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setDateRange(key)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                            dateRange === key
                              ? "bg-foreground text-background border-foreground"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setSearchTerm(""); setStatusFilter("all"); setDateRange("all"); }}
                      className="text-xs text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary outline-none rounded"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Resultados */}
            <p className="text-xs text-muted-foreground mb-3 px-1">
              Mostrando {filteredOrders.length} de {orders.length} pedidos
            </p>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No hay pedidos que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const meta = ORDER_STATUS_META[order.status as OrderStatus] ?? ORDER_STATUS_META.pendiente;
                  const StatusIcon = meta.icon;
                  const isExpanded = expandedOrder === order.id;
                  const items = Array.isArray(order.items) ? order.items as OrderItem[] : [];

                  return (
                    <div key={order.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                      <div className="w-full flex items-start sm:items-center justify-between p-3 sm:p-5 gap-2">
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="flex items-start gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-primary outline-none rounded-lg"
                          aria-expanded={isExpanded}
                          aria-label={`Pedido ${order.id.slice(0, 8)}, estado ${meta.label}`}
                        >
                          <div className={`p-2 rounded-xl ${meta.iconBg} flex-shrink-0`}>
                            <StatusIcon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground text-xs sm:text-sm">
                                #{order.id.slice(0, 8)}
                              </span>
                              <OrderStatusBadge status={order.status} />
                            </div>
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                              {new Date(order.created_at).toLocaleDateString("es-MX", {
                                year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                              {isAdmin && order.user_name && (
                                <span className="ml-1.5 text-primary font-medium">• {order.user_name}</span>
                              )}
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-bold text-foreground text-sm sm:text-base">
                            ${Number(order.total).toLocaleString("es-MX")}
                          </span>
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                        </div>
                      </div>

                      {/* Acciones rápidas admin */}
                      {isAdmin && order.status === "pendiente" && !isExpanded && (
                        <div className="px-3 sm:px-5 pb-3 sm:pb-4 flex gap-2 border-t border-border/30 pt-3">
                          <button
                            onClick={() => updateStatus(order.id, "confirmado")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-xl bg-success/10 text-success hover:bg-success/20 font-semibold text-xs sm:text-sm transition-colors focus-visible:ring-2 focus-visible:ring-success outline-none"
                          >
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" /> Confirmar
                          </button>
                          <button
                            onClick={() => updateStatus(order.id, "cancelado")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 rounded-xl bg-warning/10 text-warning hover:bg-warning/20 font-semibold text-xs sm:text-sm transition-colors focus-visible:ring-2 focus-visible:ring-warning outline-none"
                          >
                            <XIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" /> Cancelar
                          </button>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="flex items-center justify-center py-2 sm:py-2.5 px-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors focus-visible:ring-2 focus-visible:ring-destructive outline-none"
                            aria-label="Eliminar pedido"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}

                      {isExpanded && (
                        <div className="border-t border-border/50 p-4 sm:p-5 space-y-4">
                          {items.length > 0 && (
                            <div>
                              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Productos</h4>
                              <div className="space-y-2">
                                {items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      {item.image && (
                                        <img src={item.image} alt="" className="h-8 w-8 rounded-lg object-cover flex-shrink-0" />
                                      )}
                                      <span className="text-foreground truncate">{item.name}</span>
                                      <span className="text-muted-foreground flex-shrink-0">×{item.quantity}</span>
                                    </div>
                                    <span className="font-medium text-foreground flex-shrink-0">${(item.price * item.quantity).toLocaleString("es-MX")}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {order.delivery_address && (
                            <div>
                              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Dirección</h4>
                              <p className="text-sm text-foreground break-words">{order.delivery_address}</p>
                            </div>
                          )}

                          {order.notes && (
                            <div>
                              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notas</h4>
                              <p className="text-sm text-foreground break-words">{order.notes}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pt-2">
                            <a
                              href={`https://wa.me/${FLORERIA_WHATSAPP}?text=${encodeURIComponent(buildWhatsAppMessage(order, items))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-success outline-none"
                            >
                              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              {isAdmin ? "Enviar por WhatsApp" : "Consultar por WhatsApp"}
                            </a>
                            {isAdmin && (
                              <button
                                onClick={() => deleteOrder(order.id)}
                                className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-destructive outline-none"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Eliminar pedido
                              </button>
                            )}
                          </div>

                          {isAdmin && (
                            <div>
                              <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Cambiar estado</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {ORDER_STATUSES.map((key) => {
                                  const m = ORDER_STATUS_META[key];
                                  const isCurrent = order.status === key;
                                  return (
                                    <button
                                      key={key}
                                      onClick={() => updateStatus(order.id, key)}
                                      disabled={isCurrent}
                                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${
                                        isCurrent
                                          ? `${m.chip} font-medium cursor-not-allowed`
                                          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                      }`}
                                      aria-pressed={isCurrent}
                                    >
                                      {m.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
