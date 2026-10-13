import "server-only";
import { listAllProducts, listOrders, getDatabaseStatus } from "@/lib/database";

export interface OverviewMetrics {
  products: number;
  activeProducts: number;
  orders: number;
  ordersToPrepare: number;
  lowStockCount: number;
  users: number;
  engine: string;
  connected: boolean;
}

export async function getOverviewMetrics(): Promise<OverviewMetrics> {
  const [products, orders, db] = await Promise.all([
    listAllProducts(),
    listOrders(),
    getDatabaseStatus(),
  ]);
  const activeProducts = products.filter((p) => p.active === 1).length;
  const ordersToPrepare = orders.filter(
    (o) => o.status === "pending" || o.status === "paid"
  ).length;
  /* Un producto con stock NULL no tiene control de inventario:
   no cuenta ni como bajo ni como agotado. */
  const lowStockCount = products.filter(
    (p) => p.stock !== null && p.stock > 0 && p.stock <= 5
  ).length;
  return {
    products: products.length,
    activeProducts,
    orders: orders.length,
    ordersToPrepare,
    lowStockCount,
    users: db.users,
    engine: db.engine,
    connected: db.connected,
  };
}