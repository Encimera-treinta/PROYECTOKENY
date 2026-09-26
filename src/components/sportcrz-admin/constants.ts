import type { PaymentOption, StatusOption } from "./types";

/* ============================================
   OPCIONES LITERALES DEL PANEL
   Copian exactamente los CHECK de @/lib/database:
     products.category       IN ('mujeres','hombres','ninos','rebajas')
     orders.status           IN ('pending','paid','shipped','delivered','cancelled')
     orders.payment_method   IN ('pending','yappy','card','bank_transfer')
   Si la BD cambia, estos son el unico lugar a tocar.
============================================ */

export const CATEGORY_OPTIONS: PaymentOption[] = [
  { value: "mujeres", label: "MUJERES" },
  { value: "hombres", label: "HOMBRES" },
  { value: "ninos", label: "NIÑOS" },
  { value: "rebajas", label: "REBAJAS" },
];

/** products.active es 0 / 1 (INTEGER). */
export const VISIBILITY_OPTIONS: PaymentOption[] = [
  { value: "1", label: "ACTIVO" },
  { value: "0", label: "OCULTO" },
];

export const STATUS_OPTIONS: StatusOption[] = [
  { value: "pending", label: "PENDIENTE", tone: "amber" },
  { value: "paid", label: "PAGADO", tone: "blue" },
  { value: "shipped", label: "ENVIADO", tone: "blue" },
  { value: "delivered", label: "ENTREGADO", tone: "green" },
  { value: "cancelled", label: "CANCELADO", tone: "red" },
];

export const PAYMENT_OPTIONS: PaymentOption[] = [
  { value: "pending", label: "PENDIENTE" },
  { value: "yappy", label: "YAPPY" },
  { value: "card", label: "TARJETA" },
  { value: "bank_transfer", label: "TRANSFERENCIA" },
];

/* Mismo criterio que getOverviewMetrics() en @/lib/overview:
   stock > 0 && stock <= 5. */
export const LOW_STOCK_THRESHOLD = 5;

export const PAGE_SIZE = 20;
