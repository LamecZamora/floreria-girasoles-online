import { Clock, CheckCircle, Truck, XCircle, type LucideIcon } from "lucide-react";

export type OrderStatus = "pendiente" | "confirmado" | "enviado" | "entregado" | "cancelado";

interface StatusMeta {
  icon: LucideIcon;
  label: string;
  /** Background + text utility classes using semantic tokens */
  chip: string;
  /** Solid icon background */
  iconBg: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  pendiente: {
    icon: Clock,
    label: "Pendiente",
    chip: "bg-warning/10 text-warning border-warning/20",
    iconBg: "bg-warning/10 text-warning",
  },
  confirmado: {
    icon: CheckCircle,
    label: "Confirmado",
    chip: "bg-info/10 text-info border-info/20",
    iconBg: "bg-info/10 text-info",
  },
  enviado: {
    icon: Truck,
    label: "Enviado",
    chip: "bg-primary/10 text-primary border-primary/20",
    iconBg: "bg-primary/10 text-primary",
  },
  entregado: {
    icon: CheckCircle,
    label: "Entregado",
    chip: "bg-success/10 text-success border-success/20",
    iconBg: "bg-success/10 text-success",
  },
  cancelado: {
    icon: XCircle,
    label: "Cancelado",
    chip: "bg-destructive/10 text-destructive border-destructive/20",
    iconBg: "bg-destructive/10 text-destructive",
  },
};

export const ORDER_STATUSES: OrderStatus[] = ["pendiente", "confirmado", "enviado", "entregado", "cancelado"];

interface OrderStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export function OrderStatusBadge({ status, size = "sm", className = "" }: OrderStatusBadgeProps) {
  const meta = ORDER_STATUS_META[status as OrderStatus] ?? ORDER_STATUS_META.pendiente;
  const Icon = meta.icon;
  const sizing = size === "md" ? "text-sm px-3 py-1" : "text-xs px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${meta.chip} ${sizing} ${className}`}
      role="status"
      aria-label={`Estado: ${meta.label}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}
