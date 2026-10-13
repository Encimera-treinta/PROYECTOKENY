import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicOrderByCode } from "@/lib/database";
import "./orden.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { code } = await params;

  return {
    title: `Tu pedido ${decodeURIComponent(code)} | SportCrz`,
    description:
      "Revisa los articulos de tu pedido y confirma para que te lo preparemos.",
    robots: { index: false, follow: false },
  };
}

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDIENTE",
  paid: "PAGADO",
  shipped: "ENVIADO",
  delivered: "ENTREGADO",
  cancelled: "CANCELADO",
};

export default async function OrdenPage({ params }: PageProps) {
  const { code } = await params;

  const data = await getPublicOrderByCode(
    decodeURIComponent(code)
  );

  if (!data) notFound();

  const { order, items } = data;

  const unitCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <main className="orden-page">
      <header className="orden-top">
        <span>SPORTCRZ</span>
        <Link href="/">VER TIENDA</Link>
      </header>

      <div className="orden-wrap">
        <section className="orden-intro">
          <span className="orden-eyebrow">
            01 / TU PEDIDO
          </span>

          <h1>PEDIDO.</h1>

          <p className="orden-lead">
            Hola <strong>{order.customer_name}</strong>, este
            es el detalle de lo que pediste.
          </p>

          <div className="orden-meta">
            <span className="orden-code">
              {order.order_code}
            </span>

            <span
              className={`orden-status orden-status--${order.status}`}
            >
              {STATUS_LABEL[order.status] ??
                order.status.toUpperCase()}
            </span>
          </div>
        </section>

        {/* PRODUCTOS */}

        <section className="orden-items">
          {items.map((item, index) => (
            <article className="orden-item" key={item.id}>
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.product_name}
                />
              ) : (
                <div
                  className="orden-item-fallback"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
              )}

              <div className="orden-item-info">
                <span className="orden-item-qty">
                  {item.quantity}{" "}
                  {item.quantity === 1
                    ? "UNIDAD"
                    : "UNIDADES"}
                </span>

                <h3>{item.product_name}</h3>

                <span className="orden-item-price">
                  $
                  {(item.unit_price * item.quantity).toFixed(
                    2
                  )}
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* TOTAL */}

        <section className="orden-total">
          <div className="orden-total-row">
            <span>
              {unitCount}{" "}
              {unitCount === 1
                ? "ARTICULO"
                : "ARTICULOS"}
            </span>

            <strong>
              ${order.total.toFixed(2)}
            </strong>
          </div>
        </section>

        {/* ENTREGA */}

        {order.delivery_address ? (
          <section className="orden-envio">
            <span>ENTREGA</span>

            <p>{order.delivery_address}</p>

            {order.customer_phone ? (
              <p className="orden-envio-phone">
                {order.customer_phone}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* ACCION */}

        {order.status === "pending" ? (
          <section className="orden-actions">
            <p className="orden-note">
              Te contactamos por WhatsApp para coordinar
              el pago y la entrega.
            </p>

            <Link
              href="/"
              className="orden-back"
            >
              VOLVER A LA TIENDA
            </Link>
          </section>
        ) : (
          <section className="orden-actions">
            <div className="orden-done">
              <strong>
                PEDIDO{" "}
                {STATUS_LABEL[order.status] ??
                  order.status.toUpperCase()}
              </strong>

              <span>
                {order.status === "paid"
                  ? "Recibimos tu pago. Te contactamos con los detalles del envio."
                  : order.status === "cancelled"
                    ? "Este pedido fue cancelado. Si fue un error, escribinos."
                    : "Tu pedido va en camino."}
              </span>
            </div>

            <Link
              href="/"
              className="orden-back"
            >
              VOLVER A LA TIENDA
            </Link>
          </section>
        )}
      </div>

      <footer className="orden-footer">
        <span>SPORTCRZ / 2026</span>
        <span>PEDIDO {order.order_code}</span>
      </footer>
    </main>
  );
}