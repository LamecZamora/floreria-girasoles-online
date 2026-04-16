import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

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

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  pendiente: { icon: Clock, label: "Pendiente", color: "text-yellow-600 bg-yellow-500/10" },
  confirmado: { icon: CheckCircle, label: "Confirmado", color: "text-blue-600 bg-blue-500/10" },
  enviado: { icon: Truck, label: "Enviado", color: "text-purple-600 bg-purple-500/10" },
  entregado: { icon: CheckCircle, label: "Entregado", color: "text-green-600 bg-green-500/10" },
  cancelado: { icon: XCircle, label: "Cancelado", color: "text-red-600 bg-red-500/10" },
};

function PedidosPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    fetchOrders();
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

      let enrichedOrders = (data || []) as Order[];

      // If admin, fetch user profiles to show names
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

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              {isAdmin ? "Todos los Pedidos" : "Mis Pedidos"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? "Gestiona todos los pedidos de clientes" : "Revisa el estado de tus pedidos"}
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
          <div className="space-y-4">
            {orders.map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pendiente;
              const StatusIcon = config.icon;
              const isExpanded = expandedOrder === order.id;
              const items = Array.isArray(order.items) ? order.items as OrderItem[] : [];

              return (
                <div key={order.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl ${config.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground text-sm">
                            Pedido #{order.id.slice(0, 8)}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("es-MX", {
                            year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                          {isAdmin && order.user_name && (
                            <span className="ml-2 text-primary font-medium">• {order.user_name}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground">${Number(order.total).toFixed(2)}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/50 p-4 sm:p-5 space-y-4">
                      {items.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Productos</h4>
                          <div className="space-y-2">
                            {items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  {item.image && (
                                    <img src={item.image} alt={item.name} className="h-8 w-8 rounded-lg object-cover" />
                                  )}
                                  <span className="text-foreground">{item.name}</span>
                                  <span className="text-muted-foreground">×{item.quantity}</span>
                                </div>
                                <span className="font-medium text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {order.delivery_address && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Dirección</h4>
                          <p className="text-sm text-foreground">{order.delivery_address}</p>
                        </div>
                      )}

                      {order.notes && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notas</h4>
                          <p className="text-sm text-foreground">{order.notes}</p>
                        </div>
                      )}

                      {isAdmin && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Cambiar estado</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                              <button
                                key={key}
                                onClick={() => updateStatus(order.id, key)}
                                disabled={order.status === key}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                  order.status === key
                                    ? "border-primary bg-primary/10 text-primary font-medium"
                                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                } disabled:cursor-not-allowed`}
                              >
                                {val.label}
                              </button>
                            ))}
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
      </div>
    </div>
  );
}
