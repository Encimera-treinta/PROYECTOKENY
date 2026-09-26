import type { Product, Order } from "@/lib/database";

/* ============================================
   TIPOS DE DATOS DEL PANEL SPORTCRZ ADMIN
   Mapean 1:1 los DTOs reales de @/lib/database.
   No se inventa nada: cada campo viene de la
   base de datos real y se muestra tal cual.
============================================ */

export type Tone = "green" | "amber" | "blue" | "neutral" | "red";

export interface StatusOption {
  value: string;
  label: string;
  tone?: Tone;
}

export interface PaymentOption {
  value: string;
  label: string;
}

/* ============ PRODUCTOS ============ */

/** Fila de producto tal como sale de listAllProducts(). */
export type ProductRow = Product;

export interface ProductQuery {
  search: string;
  category: string;
  visibility: string;
  page: number;
  pageSize: number;
}

/** Datos del formulario (edición + creación). */
export interface ProductDraft {
  id?: number;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  image: string;
  badge: string | null;
  stock: number;
  active: number;
  sort_order: number;
  description: string | null;
  /** Foto subida en el navegador como data URL. La server action la
      redimensiona con sharp y la guarda en /uploads. Si viene vacía
      se respeta el campo `image` de ruta. */
  image_file_data?: string | null;
}

/* ============ PEDIDOS ============ */

/** Fila de pedido tal como sale de listOrders(). */
export type OrderRow = Order & { item_count: number };

export interface OrderQuery {
  search: string;
  status: string;
  page: number;
  pageSize: number;
}

/* ============ RESUMEN ============ */

export interface OverviewData {
  products: number;
  activeProducts: number;
  orders: number;
  ordersToPrepare: number;
  lowStockCount: number;
}

/** Estado extraído de getDatabaseStatus() — información real, sin inventar. */
export interface DatabaseStatusDetail {
  engine: string;
  users: number;
  products: number;
  orders: number;
  connected: boolean;
}
