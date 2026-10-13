import { requireAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/database";
import { AdminOrdersPanel } from "@/components/sportcrz-admin/AdminOrdersPanel";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  const orders = await listOrders();

  return (
    <AdminOrdersPanel
      userEmail={session.email}
      rows={orders}
      initialNotice={params.updated ? "ESTADO ACTUALIZADO." : null}
      initialError={params.error ? "NO SE PUDO ACTUALIZAR EL PEDIDO." : null}
    />
  );
}
