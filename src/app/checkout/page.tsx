"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import "./checkout.css";

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (cart.items.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      customer: {
        firstName: String(form.get("firstName") || ""),
        lastName: String(form.get("lastName") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
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

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.paymentUrl) {
        setError(data.error || "No fue posible iniciar el pago.");
        setLoading(false);
        return;
      }

      cart.clear();
      window.location.href = data.paymentUrl;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="checkout-page">
      <header className="checkout-topbar">
        <span>SPORTCRZ / CHECKOUT</span>
        <Link href="/carrito">VOLVER AL CARRITO ↗</Link>
      </header>

      <section className="checkout-hero">
        <span>01 / PAGO SEGURO</span>
        <h1>CHECKOUT.</h1>
        <p>
          Completa tus datos y paga con tarjeta o Yappy a través de TiloPay.
        </p>
      </section>

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
                <input id="firstName" name="firstName" type="text" required maxLength={80} autoComplete="given-name" />
              </div>
              <div className="checkout-field">
                <label htmlFor="lastName">APELLIDOS</label>
                <input id="lastName" name="lastName" type="text" required maxLength={80} autoComplete="family-name" />
              </div>
            </div>

            <div className="checkout-field">
              <label htmlFor="email">CORREO</label>
              <input id="email" name="email" type="email" required maxLength={120} autoComplete="email" />
            </div>

            <div className="checkout-row">
              <div className="checkout-field">
                <label htmlFor="phone">TELÉFONO</label>
                <input id="phone" name="phone" type="tel" maxLength={20} autoComplete="tel" />
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
              <span>↗</span>
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
                <img src={item.image} alt={item.name} />
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

      <footer className="checkout-footer">
        <span>SPORTCRZ / 2026</span>
        <span>TARJETAS · YAPPY · TILOPAY</span>
      </footer>
    </main>
  );
}
