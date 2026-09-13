import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCustomerSession,
  requireCustomer,
} from "@/lib/customer-auth";
import {
  getCustomerById,
  listPaymentMethods,
  listOrdersByCustomerEmail,
} from "@/lib/database";
import {
  updateProfileAction,
  addCardAction,
  addYappyAction,
  setDefaultPaymentAction,
  deletePaymentAction,
  logoutAction,
} from "./actions";
import "./cuenta.css";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mi Cuenta | SportCrz" };

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDIENTE",
  paid: "PAGADO",
  shipped: "ENVIADO",
  delivered: "ENTREGADO",
  cancelled: "CANCELADO",
};

const FLASH: Record<string, string> = {
  "added=card": "TARJETA AGREGADA CORRECTAMENTE.",
  "added=yappy": "YAPPY VINCULADO CORRECTAMENTE.",
  "updated=default": "MÉTODO PREDETERMINADO ACTUALIZADO.",
  "deleted=payment": "MÉTODO DE PAGO ELIMINADO.",
  "updated=profile": "PERFIL ACTUALIZADO.",
  "welcome=1": "BIENVENIDO A SPORTCRZ. TU CUENTA ESTÁ LISTA.",
};

const ERRORS: Record<string, string> = {
  holder: "Ingresa el nombre del titular de la tarjeta.",
  cardnumber: "Número de tarjeta inválido (13-19 dígitos).",
  cardexp: "Fecha de vencimiento inválida.",
  yappyphone: "Ingresa un número de teléfono Yappy válido.",
  name: "El nombre no puede estar vacío.",
};

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await requireCustomer();
  const params = await searchParams;

  const customer = await getCustomerById(session.customerId);
  if (!customer) {
    redirect("/cuenta/login");
  }

  const [orders, payments] = await Promise.all([
    listOrdersByCustomerEmail(session.email),
    listPaymentMethods(session.customerId),
  ]);

  const cards = payments.filter((p) => p.method === "card");
  const yappys = payments.filter((p) => p.method === "yappy");

  const flashKey = params.added
    ? `added=${params.added}`
    : params.updated
      ? `updated=${params.updated}`
      : params.deleted
        ? `deleted=${params.deleted}`
        : params.welcome
          ? "welcome=1"
          : null;

  const flashText = flashKey ? (FLASH[flashKey] ?? null) : null;
  const errorText = params.error
    ? (ERRORS[params.error] ?? "Revisa los datos.")
    : null;

  return (
    <main className="cuenta-page">
      <header className="cuenta-topbar">
        <span>SPORTCRZ / MI CUENTA</span>
        <form action={logoutAction}>
          <button type="submit">CERRAR SESIÓN</button>
        </form>
      </header>

      <section className="cuenta-hero">
        <p className="cuenta-kicker">CLIENTE SPORTCRZ</p>
        <h1>{customer.full_name.split(" ")[0].toUpperCase()}.</h1>
        <p className="cuenta-meta">
          {customer.email}
          {customer.phone ? ` — ${customer.phone}` : ""}
        </p>
      </section>

      {(flashText || errorText) && (
        <section className="cuenta-flash-area">
          {flashText && <p className="cuenta-flash ok">{flashText}</p>}
          {errorText && <p className="cuenta-flash err">{errorText}</p>}
        </section>
      )}

      <div className="cuenta-grid">
        {/* ============ PEDIDOS ============ */}
        <section className="cuenta-block" id="pedidos">
          <div className="cuenta-block-head">
            <span>01 / MIS PEDIDOS</span>
            <span>{orders.length} REGISTRO(S)</span>
          </div>

          {orders.length === 0 ? (
            <p className="cuenta-empty">
              Todavía no tienes pedidos. Cuando compres, aparecerán aquí con su
              estado de entrega.
            </p>
          ) : (
            <div className="cuenta-orders">
              {orders.map((order) => (
                <article key={order.id} className="cuenta-order">
                  <div className="cuenta-order-top">
                    <span className="cuenta-order-code">
                      {order.order_code}
                    </span>
                    <span
                      className={`cuenta-order-status ${order.status}`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="cuenta-order-mid">
                    <span>
                      {new Date(order.created_at).toLocaleDateString("es-PA", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>{order.item_count} ARTÍCULO(S)</span>
                    <span className="cuenta-order-total">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ============ TARJETAS BG ============ */}
        <section className="cuenta-block" id="tarjetas">
          <div className="cuenta-block-head">
            <span>02 / TARJETAS — BANCO GENERAL</span>
            <span>{cards.length} GUARDADA(S)</span>
          </div>

          <div className="cuenta-cards">
            {cards.map((card) => (
              <article
                key={card.id}
                className={`cuenta-card ${card.is_default ? "default" : ""}`}
              >
                <div className="cuenta-card-top">
                  <span className="cuenta-card-brand">
                    {card.card_brand ?? "TARJETA"}
                  </span>
                  {card.is_default === 1 && (
                    <span className="cuenta-card-default">PREDETERMINADA</span>
                  )}
                </div>
                <p className="cuenta-card-number">
                  •••• •••• •••• {card.card_last4}
                </p>
                <div className="cuenta-card-meta">
                  <span>{card.card_holder}</span>
                  <span>
                    {String(card.card_exp_month).padStart(2, "0")}/
                    {String(card.card_exp_year).slice(-2)}
                  </span>
                </div>
                <div className="cuenta-card-actions">
                  {card.is_default !== 1 && (
                    <form action={setDefaultPaymentAction}>
                      <input type="hidden" name="id" value={card.id} />
                      <button type="submit">USAR POR DEFECTO</button>
                    </form>
                  )}
                  <form action={deletePaymentAction}>
                    <input type="hidden" name="id" value={card.id} />
                    <button type="submit" className="danger">
                      ELIMINAR
                    </button>
                  </form>
                </div>
              </article>
            ))}

            <form action={addCardAction} className="cuenta-card-form">
              <p className="cuenta-form-title">AGREGAR TARJETA</p>
              <label>
                TITULAR
                <input name="card_holder" type="text" required autoCapitalize="words" autoComplete="cc-name" enterKeyHint="next" />
              </label>
              <label>
                NÚMERO
                <input name="card_number" type="text" inputMode="numeric" required autoComplete="cc-number" placeholder="4111 1111 1111 1111" enterKeyHint="next" />
              </label>
              <div className="cuenta-form-row">
                <label>
                  MES
                  <input name="card_exp_month" type="number" min="1" max="12" inputMode="numeric" required placeholder="MM" autoComplete="cc-exp-month" enterKeyHint="next" />
                </label>
                <label>
                  AÑO
                  <input name="card_exp_year" type="number" min="2026" max="2100" inputMode="numeric" required placeholder="YYYY" autoComplete="cc-exp-year" enterKeyHint="done" />
                </label>
              </div>
              <button type="submit">GUARDAR TARJETA</button>
              <p className="cuenta-form-hint">
                Por seguridad solo guardamos la marca, el titular y los
                últimos 4 dígitos. El número completo nunca se almacena.
              </p>
            </form>
          </div>
        </section>

        {/* ============ YAPPY ============ */}
        <section className="cuenta-block" id="yappy">
          <div className="cuenta-block-head">
            <span>03 / YAPPY — BANCO GENERAL</span>
            <span>{yappys.length} VINCULADO(S)</span>
          </div>

          <div className="cuenta-yappys">
            {yappys.map((y) => (
              <article key={y.id} className={`cuenta-yappy ${y.is_default ? "default" : ""}`}>
                <div className="cuenta-yappy-info">
                  <span className="cuenta-yappy-label">YAPPY</span>
                  <span className="cuenta-yappy-phone">{y.yappy_phone}</span>
                  {y.is_default === 1 && (
                    <span className="cuenta-card-default">PREDETERMINADO</span>
                  )}
                </div>
                <div className="cuenta-card-actions">
                  {y.is_default !== 1 && (
                    <form action={setDefaultPaymentAction}>
                      <input type="hidden" name="id" value={y.id} />
                      <button type="submit">USAR POR DEFECTO</button>
                    </form>
                  )}
                  <form action={deletePaymentAction}>
                    <input type="hidden" name="id" value={y.id} />
                    <button type="submit" className="danger">
                      ELIMINAR
                    </button>
                  </form>
                </div>
              </article>
            ))}

            <form action={addYappyAction} className="cuenta-card-form">
              <p className="cuenta-form-title">VINCULAR YAPPY</p>
              <label>
                TELÉFONO ASOCIADO A YAPPY
                <input name="yappy_phone" type="tel" inputMode="tel" required placeholder="6000-0000" autoComplete="tel" enterKeyHint="done" />
              </label>
              <button type="submit">VINCULAR YAPPY</button>
              <p className="cuenta-form-hint">
                Al pagar con Yappy, el teléfono vinculado recibe la solicitud
                de pago en la app de Banco General.
              </p>
            </form>
          </div>
        </section>

        {/* ============ PERFIL ============ */}
        <section className="cuenta-block" id="perfil">
          <div className="cuenta-block-head">
            <span>04 / MI PERFIL</span>
          </div>

          <form action={updateProfileAction} className="cuenta-card-form">
            <label>
              NOMBRE COMPLETO
              <input
                name="full_name"
                type="text"
                required
                defaultValue={customer.full_name}
                autoCapitalize="words"
                autoComplete="name"
                enterKeyHint="next"
              />
            </label>
            <label>
              TELÉFONO
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={customer.phone ?? ""}
                autoComplete="tel"
                enterKeyHint="done"
              />
            </label>
            <label>
              CORREO (NO EDITABLE)
              <input type="email" defaultValue={customer.email} disabled />
            </label>
            <button type="submit">GUARDAR CAMBIOS</button>
          </form>
        </section>
      </div>

      <footer className="cuenta-footer">
        <span>SPORTCRZ / 2026</span>
        <Link href="/">VOLVER A LA TIENDA</Link>
      </footer>
    </main>
  );
}
