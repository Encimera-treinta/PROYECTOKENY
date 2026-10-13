import { requireAdmin } from "@/lib/admin-auth";
import { getOverviewMetrics } from "@/lib/overview";
import { AdminOverviewPanel } from "@/components/sportcrz-admin/AdminOverviewPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdmin();
  const metrics = await getOverviewMetrics();

  return (
    <AdminOverviewPanel
      userEmail={session.email}
      data={{
        products: metrics.products,
        activeProducts: metrics.activeProducts,
        orders: metrics.orders,
        ordersToPrepare: metrics.ordersToPrepare,
        lowStockCount: metrics.lowStockCount,
      }}
    />
  );
}
