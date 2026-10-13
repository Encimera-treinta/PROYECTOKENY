"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import "../app/checkout/checkout.css";
import "../app/checkout/checkout-done.css";

type Me = {
  authenticated: boolean;
  email?: string;
  phone?: string | null;
  firstName?: string;
  lastName?: string;
};

export default function CheckoutClient() {
  const cart = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  /* Pedido registrado sin pago online (TiloPay sin configurar). */
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [orderUrl, setOrderUrl] = useState<string | null>(null);
  const [descartados, setDescartados] = useState<string[]>([]);

  /* Precarga los datos del cliente con sesión iniciada. */
  useEffect(() => {
    fetch("/api/customer/me")
      .then((r) => r.json())
      .then((data: Me) => setMe(data))
      .catch(() => setMe({ authenticated: false }));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (cart.items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    const form = new FormData(event.currentTarget);

    /* Lo que viene del form manda, pero si esta vacio se
       completa con la cuenta: asi no se puede fallar por
       dejar un campo en blanco. */
    const firstName =
      String(form.get("firstName") || "").trim() ||
      me?.firstName ||
      "";
    const lastName =
      String(form.get("lastName") || "").trim() ||
      me?.lastName ||
      "";
    const email =
      String(form.get("email") || "").trim() ||
      me?.email ||
      "";

    const payload = {
      customer: {
        firstName,
        lastName,
        email,
        phone:
          String(form.get("phone") || "").trim() ||
          me?.phone ||
          "",
        address: String(form.get("address") || ""),
        city: String(form.get("city") || ""),
        state: "PA",
        zip: String(form.get("zip") || ""),
        country: "PA",
      },
      items: cart.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    setLoading(true);

    /* Se abre una pestana vacia antes de la peticion: si se
       abriera despues, el navegador la bloquearia como popup.
       Despues se navega a WhatsApp con el pedido ya escrito. */
    const pending = window.open("", "_blank");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      /* Sesion caida: al login y se vuelve al checkout. */
      if (response.status === 401) {
        pending?.close();
        setLoading(false);
        router.push("/cuenta/login?next=/checkout");
        return;
      }

      /* Pago online (TiloPay configurado). */
      if (data.paymentUrl) {
        pending?.close();
        cart.clear();
        window.location.href = data.paymentUrl;
        return;
      }

      /* Sin TiloPay: la orden quedo registrada y el cliente
         confirma por WhatsApp. */
      if (!response.ok || !data.orderCode) {
        pending?.close();
        setError(data.error || "No fue posible registrar el pedido.");
        setLoading(false);
        return;
      }

      cart.clear();
      setOrderCode(data.orderCode);
      setWhatsappUrl(data.whatsappUrl || null);
      setOrderUrl(data.orderUrl || null);
      setDescartados(
        Array.isArray(data.descartados)
          ? data.descartados
          : []
      );
      setLoading(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      /* Se manda de una, sin segundo clic. */
      if (data.whatsappUrl) {
        if (pending) {
          pending.location.href = data.whatsappUrl;
        } else {
          window.location.href = data.whatsappUrl;
        }
      }
    } catch {
      pending?.close();
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="checkout-page">
      <header className="checkout-topbar">
        <span>SPORTCRZ / CHECKOUT</span>
        <Link href="/carrito">VOLVER AL CARRITO</Link>
      </header>

      <section className="checkout-hero">
        <span>{orderCode ? "02 / CONFIRMADO" : "01 / PAGO SEGURO"}</span>
        <h1>{orderCode ? "LISTO." : "CHECKOUT."}</h1>
        <p>
          {orderCode
            ? "Tu pedido ya quedó registrado en el sistema."
            : "Completa tus datos y paga con tarjeta o Yappy a través de TiloPay."}
        </p>
      </section>

      {/* Pedido ya registrado: se oculta todo el formulario y el
          resumen para no dejar un "PAGAR $0.00" que no hace nada. */}

      {orderCode ? (
        <section className="checkout-done">
          <span className="checkout-done-badge">PEDIDO REGISTRADO</span>

          <h2>
            ¡LISTO
            {me?.firstName ? `, ${me.firstName}` : ""}!
          </h2>

          <p>
            Tu pedido quedó registrado con el código{" "}
            <strong>{orderCode}</strong>. Te contactamos para coordinar
            el pago y la entrega.
          </p>

          {descartados.length > 0 ? (
            <div className="checkout-done-warn">
              <strong>
                NO SE INCLUYERON{" "}
                {descartados.length}{" "}
                {descartados.length === 1
                  ? "ARTICULO"
                  : "ARTICULOS"}
              </strong>

              <p>{descartados.join(" · ")}</p>
            </div>
          ) : null}

          {orderUrl ? (
            <div className="checkout-done-link">
              <span className="checkout-done-link-label">
                GUARDÁ ESTE LINK
              </span>

              <input
                readOnly
                value={orderUrl}
                onFocus={(event) =>
                  event.currentTarget.select()
                }
                aria-label="Link de tu pedido"
              />

              <p>
                Con este link podés ver el detalle de tu
                pedido cuando quieras, sin entrar.
              </p>
            </div>
          ) : null}

          {whatsappUrl ? (
            <a
              className="checkout-done-wa"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>CONFIRMAR POR WHATSAPP</span>
              <span>→</span>
            </a>
          ) : (
            <p className="checkout-done-hint">
              Guardá tu código. Te escribimos al correo{" "}
              <strong>{me?.email || "registrado"}</strong> para confirmar.
            </p>
          )}

          <Link href="/" className="checkout-done-back">
            VOLVER A LA TIENDA
          </Link>
        </section>
      ) : (
        <>
      <div className="checkout-layout">
        <section className="checkout-form-section">
          <form className="checkout-form" onSubmit={handleSubmit}>
            {error && (
              <div className="checkout-error">
                <span>ERROR</span>
                <p>{error}</p>
              </div>
            )}

            <div className="checkout-row">
              <div className="checkout-field">
                <label htmlFor="firstName">NOMBRE</label>
                <input id="firstName" name="firstName" type="text" required maxLength={80} autoComplete="given-name" defaultValue={me?.authenticated ? (me.firstName ?? "") : ""} />
              </div>
              <div className="checkout-field">
                <label htmlFor="lastName">APELLIDOS</label>
                <input id="lastName" name="lastName" type="text" required maxLength={80} autoComplete="family-name" defaultValue={me?.authenticated ? (me.lastName ?? "") : ""} />
              </div>
            </div>

            <div className="checkout-field">
              <label htmlFor="email">CORREO</label>
              <input id="email" name="email" type="email" required maxLength={120} autoComplete="email" defaultValue={me?.authenticated ? (me.email ?? "") : ""} />
            </div>

            <div className="checkout-row">
              <div className="checkout-field">
                <label htmlFor="phone">TELÉFONO</label>
                <input id="phone" name="phone" type="tel" maxLength={20} autoComplete="tel" defaultValue={me?.authenticated && me.phone ? me.phone : ""} />
              </div>
              <div className="checkout-field">
                <label htmlFor="zip">CÓDIGO POSTAL</label>
                <input id="zip" name="zip" type="text" maxLength={10} autoComplete="postal-code" />
              </div>
            </div>

            <div className="checkout-field">
              <label htmlFor="city">CIUDAD</label>
              <input id="city" name="city" type="text" maxLength={60} />
            </div>

            <div className="checkout-field">
              <label htmlFor="address">DIRECCIÓN DE ENVÍO</label>
              <input id="address" name="address" type="text" maxLength={200} autoComplete="street-address" />
            </div>

            <button
              className="checkout-submit"
              type="submit"
              disabled={loading || cart.items.length === 0}
            >
              <span>{loading ? "PROCESANDO..." : `PAGAR $${cart.total.toFixed(2)}`}</span>
              <span></span>
            </button>

            <p className="checkout-note">
              Serás redirigido a la plataforma segura de TiloPay para
              completar el pago con tarjeta o Yappy.
            </p>
          </form>
        </section>

        <aside className="checkout-summary">
          <div className="checkout-summary-head">
            <span>RESUMEN</span>
            <h2>TU PEDIDO</h2>
          </div>

          <div className="checkout-items">
            {cart.items.length === 0 && (
              <p className="checkout-empty">Tu carrito está vacío.</p>
            )}
            {cart.items.map((item, index) => (
              <div className="checkout-item" key={`${item.name}-${index}`}>
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="checkout-item-fallback" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                )}
                <div>
                  <span>{item.name}</span>
                  <strong>
                    {item.quantity} × ${item.price.toFixed(2)}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout-total">
            <span>TOTAL</span>
            <strong>${cart.total.toFixed(2)}</strong>
          </div>
        </aside>
      </div>
        </>
      )}

      <footer className="checkout-footer">
        <span>SPORTCRZ / 2026</span>
        <span>TARJETAS · YAPPY · TILOPAY</span>
      </footer>
    </main>
  );
}