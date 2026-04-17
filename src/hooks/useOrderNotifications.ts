import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package } from "lucide-react";
import React from "react";

/**
 * Subscribes to realtime order changes.
 * - Admin: notified of every new order across the store.
 * - Client: notified when their own order's status changes.
 */
export function useOrderNotifications() {
  const { user, isAdmin, loading } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    // Clean any prior channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (isAdmin) {
      // Admin: listen for ANY new order
      const channel = supabase
        .channel("admin-orders")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            const order = payload.new as { id: string; total: number };
            toast.success("¡Nuevo pedido recibido! 🌻", {
              description: `Pedido #${order.id.slice(0, 8)} • $${Number(order.total).toFixed(2)}`,
              duration: 8000,
              icon: React.createElement(Package, { className: "h-4 w-4" }),
              action: {
                label: "Ver",
                onClick: () => { window.location.href = "/pedidos"; },
              },
            });
            // Subtle audio ping
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g); g.connect(ctx.destination);
              o.frequency.value = 880; g.gain.value = 0.05;
              o.start(); o.stop(ctx.currentTime + 0.15);
            } catch {}
          }
        )
        .subscribe();
      channelRef.current = channel;
    } else {
      // Client: listen for status updates on their own orders
      const channel = supabase
        .channel(`client-orders-${user.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
          (payload) => {
            const oldStatus = (payload.old as { status?: string })?.status;
            const newOrder = payload.new as { id: string; status: string };
            if (oldStatus && oldStatus !== newOrder.status) {
              const labels: Record<string, string> = {
                confirmado: "Tu pedido fue confirmado ✅",
                enviado: "Tu pedido va en camino 🚚",
                entregado: "Tu pedido fue entregado 🌻",
                cancelado: "Tu pedido fue cancelado",
              };
              toast(labels[newOrder.status] ?? "Tu pedido cambió de estado", {
                description: `Pedido #${newOrder.id.slice(0, 8)}`,
                duration: 7000,
              });
            }
          }
        )
        .subscribe();
      channelRef.current = channel;
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, isAdmin, loading]);
}
