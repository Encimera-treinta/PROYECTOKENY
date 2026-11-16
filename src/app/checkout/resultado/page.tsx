import Link from "next/link";
import { getOrderByCode } from "@/lib/database";
import "../checkout.css";

export const dynamic = "force-dynamic";

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawOrder = resolved.order;
  const orderCode = Array.isArray(rawOrder) ? rawOrder[0] : rawOrder;
  const order = orderCode ? await getOrderByCode(orderCode) : undefined;
  const orderState =
    order?.status === "paid" ||
    order?.status === "shipped" ||
    order?.status === "delivered"
      ? "paid"
      : order?.status === "cancelled"
        ? "cancelled"
        : order
          ? "pending"
          : "unknown";

  return (
    <main className="checkout-result">
      <header className="checkout-result-topbar">
        <span>SPORTCRZ / RESULTADO</span>
        <Link href="/">VOLVER A LA TIENDA</Link>
      </header>
      <section className="checkout-result-body">
        <div className={`checkout-result-card ${orderState === "paid" ? "ok" : "fail"}`}>
          <span>01 / ESTADO DEL PAGO</span>
          <h1>
            {orderState === "paid"
              ? "PAGO EXITOSO."
              : orderState === "cancelled"
                ? "PAGO NO COMPLETADO."
                : orderState === "pending"
                  ? "PAGO PENDIENTE DE CONFIRMACIÓN."
                  : "ORDEN NO ENCONTRADA."}
          </h1>
          <p>
            {orderState === "paid"
              ? "Recibimos tu pago. Te contactaremos por correo con los detalles del envío."
              : orderState === "cancelled"
                ? "La transacción fue rechazada o cancelada. No se realizó ningún cobro."
                : orderState === "pending"
                  ? "Yappy aún no ha confirmado el pago. No vuelvas a pagar; el estado se actualizará al recibir la confirmación."
                  : "No pudimos identificar la orden. Si fuiste cobrado, escríbenos."}
          </p>
          {orderCode && <div className="checkout-result-code">{orderCode}</div>}
          {orderState === "paid" && order && (
            <p>TOTAL PAGADO: ${order.total.toFixed(2)} · {order.customer_email}</p>
          )}
          <div className="checkout-result-actions">
            <Link href="/">SEGUIR COMPRANDO</Link>
            {orderState === "pending" && orderCode && (
              <Link href={`/checkout/resultado?order=${encodeURIComponent(orderCode)}`} className="secondary">
                ACTUALIZAR ESTADO
              </Link>
            )}
            {orderState !== "paid" && (
              <Link href="/carrito" className="secondary">VOLVER AL CARRITO</Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
