import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders, type Order } from "@/lib/database";
import { updateOrderStatusAction } from "./actions";
import "../login/admin.css";
import "../productos/productos.css";

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDIENTE",
  paid: "PAGADO",
  shipped: "ENVIADO",
  delivered: "ENTREGADO",
  cancelled: "CANCELADO",
};

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const orders = listOrders();

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <div>
          <span>SPORTCRZ / CONTROL</span>
          <strong>GESTIÓN DE PEDIDOS</strong>
        </div>
        <div className="admin-top-actions">
          <Link href="/admin">DASHBOARD</Link>
          <Link href="/">VER TIENDA ↗</Link>
          <form action="/api/admin/logout" method="post">
            <button type="submit">CERRAR SESIÓN</button>
          </form>
        </div>
      </header>

      <section className="admin-hero">
        <span>03 / VENTAS</span>
        <h1>PEDIDOS.</h1>
        <p>{orders.length} pedido(s) registrados.</p>
      </section>

      <section className="admin-products-toolbar">
        {params.updated && <p className="admin-flash ok">ESTADO ACTUALIZADO.</p>}
        {params.error && <p className="admin-flash err">NO SE PUDO ACTUALIZAR EL PEDIDO.</p>}
      </section>

      <section className="admin-orders-table">
        <table>
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>CLIENTE</th>
              <th>ARTÍCULOS</th>
              <th>TOTAL</th>
              <th>PAGO</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-empty-row">
                  SIN PEDIDOS AÚN. SE CREARÁN CUANDO SE ACTIVE EL CHECKOUT.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </section>

      <footer className="admin-footer">
        <span>SESIÓN ACTIVA / PEDIDOS</span>
        <strong>{orders.length} REGISTROS</strong>
      </footer>
    </main>
  );
}

function OrderRow({ order }: { order: Order & { item_count: number } }) {
  return (
    <tr>
      <td data-label="CÓDIGO">{order.order_code}</td>
      <td data-label="CLIENTE">
        <span className="admin-product-cell">
          <span>
            <strong>{order.customer_name}</strong>
            <br />
            {order.customer_email}
          </span>
        </span>
      </td>
      <td data-label="ARTÍCULOS">{order.item_count}</td>
      <td data-label="TOTAL">${order.total.toFixed(2)}</td>
      <td data-label="PAGO">{order.payment_method.toUpperCase()}</td>
      <td data-label="ESTADO">
        <span className={`admin-status-pill ${order.status}`}>
          {STATUS_LABELS[order.status] ?? order.status.toUpperCase()}
        </span>
      </td>
      <td data-label="ACCIONES">
        <form className="admin-order-status-form" action={updateOrderStatusAction}>
          <input type="hidden" name="id" value={order.id} />
          <select name="status" defaultValue={order.status}>
            <option value="pending">PENDIENTE</option>
            <option value="paid">PAGADO</option>
            <option value="shipped">ENVIADO</option>
            <option value="delivered">ENTREGADO</option>
            <option value="cancelled">CANCELADO</option>
          </select>
          <button type="submit">GUARDAR</button>
        </form>
      </td>
    </tr>
  );
}
