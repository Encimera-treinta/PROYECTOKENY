import Link from "next/link";
import {
  getOrderByCode,
  markOrderPaid,
  markOrderCancelled,
} from "@/lib/database";
import "../checkout.css";

export const dynamic = "force-dynamic";

type ResultParams = {
  code?: string;
  description?: string;
  auth?: string;
  order?: string;
  tilopay_transaction?: string;
};

function parseParams(search: string): ResultParams {
  const params = new URLSearchParams(search);
  const result: ResultParams = {};

  const code = params.get("code");
  if (code !== null) result.code = code;

  const description = params.get("description");
  if (description !== null) result.description = description;

  const auth = params.get("auth");
  if (auth !== null) result.auth = auth;

  const order = params.get("order");
  if (order !== null) result.order = order;

  const transaction = params.get("tilopay-transaction");
  if (transaction !== null) result.tilopay_transaction = transaction;

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
  const approved = params.code === "1";
  const orderCode = params.order;

  let orderState: "paid" | "pending" | "cancelled" | "unknown" = "unknown";

  if (orderCode) {
    if (approved) {
      const reference = params.auth || params.tilopay_transaction || "";
      const ok = await markOrderPaid(orderCode, "card", reference);
      orderState = ok ? "paid" : "unknown";
    } else {
      await markOrderCancelled(orderCode);
      orderState = "cancelled";
    }
  }

  const order = orderCode ? await getOrderByCode(orderCode) : undefined;

  return (
    <main className="checkout-result">
      <header className="checkout-result-topbar">
        <span>SPORTCRZ / RESULTADO</span>
        <Link href="/">VOLVER A LA TIENDA ↗</Link>
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
                : "ORDEN NO ENCONTRADA."}
          </h1>

          <p>
            {orderState === "paid"
              ? "Recibimos tu pago. Te contactaremos por correo con los detalles del envío."
              : orderState === "cancelled"
                ? params.description ||
                  "La transacción fue rechazada o cancelada. No se realizó ningún cobro."
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
            <Link href="/">SEGUIR COMPRANDO ↗</Link>
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
