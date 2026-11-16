import Link from "next/link";
import {
  getOrderByCode,
  markOrderPaid,
  markOrderCancelled,
} from "@/lib/database";
import { consultPayment } from "@/lib/tilopay";
import "../checkout.css";

export const dynamic = "force-dynamic";

type ResultParams = {
  description?: string;
  order?: string;
};

function parseParams(search: string): ResultParams {
  const params = new URLSearchParams(search);
  const result: ResultParams = {};

  const description = params.get("description");
  if (description !== null) result.description = description;

  const order = params.get("order");
  if (order !== null) result.order = order;

  return result;
}

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(resolved)) {
    if (typeof value === "string") search.set(key, value);
    else if (Array.isArray(value) && value[0]) search.set(key, value[0]);
  }

  const params = parseParams(`?${search.toString()}`);
  const orderCode = params.order;

  let orderState: "paid" | "pending" | "cancelled" | "unknown" = "unknown";
  const order = orderCode ? await getOrderByCode(orderCode) : undefined;

  if (
    order?.status === "paid" ||
    order?.status === "shipped" ||
    order?.status === "delivered"
  ) {
    orderState = "paid";
  } else if (order?.status === "cancelled") {
    orderState = "cancelled";
  } else if (orderCode && order) {
    try {
      const transaction = await consultPayment(orderCode);

      if (
        transaction?.orderNumber === orderCode &&
        transaction.code === "1" &&
        transaction.capture?.toLowerCase() === "capture" &&
        Number.isFinite(Number(transaction.amount)) &&
        Math.round(Number(transaction.amount) * 100) ===
          Math.round(order.total * 100) &&
        transaction.currency?.toUpperCase() ===
          (process.env.TILOPAY_CURRENCY || "USD").toUpperCase() &&
        (process.env.NODE_ENV !== "production" ||
          transaction.environment?.toLowerCase() === "production")
      ) {
        const reference =
          transaction.auth || String(transaction.id_tilopay ?? "");
        const methodHint = [
          transaction.payment_method,
          transaction.paymentMethod,
          transaction.method,
        ]
          .find((value) => typeof value === "string" && value.length > 0)
          ?.toLowerCase();
        const paymentMethod =
          methodHint?.includes("yappy") ||
          (!methodHint && !transaction.card && !transaction.last)
            ? "yappy"
            : "card";
        const ok = await markOrderPaid(
          orderCode,
          paymentMethod,
          reference
        );
        orderState = ok ? "paid" : "unknown";
      } else if (
        transaction?.orderNumber === orderCode &&
        transaction.code !== undefined &&
        transaction.code !== "1"
      ) {
        await markOrderCancelled(orderCode);
        orderState = "cancelled";
      } else {
        orderState = order.status === "paid" ? "paid" : "pending";
      }
    } catch (error) {
      console.error("[tilopay] no se pudo verificar el resultado:", error);
      orderState = order.status === "paid" ? "paid" : "pending";
    }
  }

  return (
    <main className="checkout-result">
      <header className="checkout-result-topbar">
        <span>SPORTCRZ / RESULTADO</span>
        <Link href="/">VOLVER A LA TIENDA</Link>
      </header>

      <section className="checkout-result-body">
        <div
          className={`checkout-result-card ${
            orderState === "paid" ? "ok" : "fail"
          }`}
        >
          <span>01 / ESTADO DEL PAGO</span>

          <h1>
            {orderState === "paid"
              ? "PAGO EXITOSO."
              : orderState === "cancelled"
                ? "PAGO NO COMPLETADO."
                : orderState === "pending"
                  ? "PAGO PENDIENTE DE VERIFICACIÓN."
                  : "ORDEN NO ENCONTRADA."}
          </h1>

          <p>
            {orderState === "paid"
              ? "Recibimos tu pago. Te contactaremos por correo con los detalles del envío."
              : orderState === "cancelled"
                ? params.description ||
                  "La transacción fue rechazada o cancelada. No se realizó ningún cobro."
                : orderState === "pending"
                  ? "Aún no pudimos confirmar la transacción con TiloPay. No vuelvas a pagar; revisaremos el estado del pedido."
                : "No pudimos identificar la orden. Si fuiste cobrado, escríbenos."}
          </p>

          {orderCode && (
            <div className="checkout-result-code">{orderCode}</div>
          )}

          {orderState === "paid" && order && (
            <p>
              TOTAL PAGADO: ${order.total.toFixed(2)} ·{" "}
              {order.customer_email}
            </p>
          )}

          <div className="checkout-result-actions">
            <Link href="/">SEGUIR COMPRANDO</Link>
            {orderState !== "paid" && (
              <Link href="/carrito" className="secondary">
                VOLVER AL CARRITO
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
