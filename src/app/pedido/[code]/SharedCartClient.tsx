"use client";

import { useMemo, useState } from "react";
import type { SharedCart } from "@/lib/database";

type Props = {
  cart: SharedCart;
};

const money = (value: number) => `$${value.toFixed(2)}`;

/* WhatsApp exige formato internacional sin +.
   Un numero panameno de 8 digitos necesita el prefijo 507;
   si ya viene con prefijo se respeta tal cual. */
function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length === 8) return `507${digits}`;

  return digits;
}

/**
 * Numero de la tienda configurado en STORE_WHATSAPP.
 * Se expone al cliente para que el boton "Confirmar" abra WhatsApp
 * con el pedido ya escrito.
 */
const STORE_WHATSAPP = (
  process.env.NEXT_PUBLIC_STORE_WHATSAPP || ""
).replace(/\D/g, "");

export default function SharedCartClient({ cart }: Props) {
  const [status, setStatus] = useState(cart.status);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const unitCount = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items]
  );

  /* Texto plano del pedido: sirve para WhatsApp y para copiar. */
  const plainText = useMemo(() => {
    const lines = [
      `Hola! Quiero confirmar este pedido de SportCrz.`,
      ``,
      `Codigo: ${cart.code}`,
      cart.sender_name ? `De parte de: ${cart.sender_name}` : ``,
      ``,
      ...cart.items.map(
        (item, index) =>
          `${index + 1}. ${item.product_name} x${item.quantity} — ${money(
            item.unit_price * item.quantity
          )}`
      ),
      ``,
      `Total: ${money(cart.total)}`,
    ];

    return lines.filter((line) => line !== null).join("\n");
  }, [cart]);

  const whatsappHref = useMemo(() => {
    if (!STORE_WHATSAPP) return "";

    return `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
      plainText
    )}`;
  }, [plainText]);

  async function handleConfirm() {
    if (status === "confirmed") return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/shared-cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cart.code, status: "confirmed" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        setError(
          data.error || "No se pudo registrar la confirmacion."
        );

        return;
      }

      setStatus("confirmed");

      /* Abre WhatsApp con el pedido ya escrito. */
      if (whatsappHref) {
        window.open(whatsappHref, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plainText);

      setCopied(true);

      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("No se pudo copiar en este navegador.");
    }
  }

  return (
    <>
      {/* QUIEN LO ENVIO */}

      <section className="pedido-intro">
        <span className="pedido-eyebrow">
          {cart.status === "confirmed"
            ? "PEDIDO CONFIRMADO"
            : "TENES UN PEDIDO"}
        </span>

        <h1>
          {cart.status === "confirmed"
            ? "¡LISTO!"
            : cart.sender_name
              ? `${cart.sender_name} TE ELIGIO`
              : "ESTO ES PARA VOS"}
        </h1>

        <p className="pedido-lead">
          {cart.status === "confirmed"
            ? "Este pedido ya fue confirmado. SportCrz se pondra en contacto contigo."
            : cart.sender_name
              ? `${cart.sender_name} eligio estas prendas para vos. Revisa la lista y confirma para que te las entreguemos.`
              : "Estas son las prendas que eligieron para vos. Revisa la lista y confirma para que te las entregaremos."}
        </p>
      </section>

      {/* QUIEN TE LO MANDA */}

      <section className="pedido-remitente">
        <span className="pedido-remitente-label">
          TE LO MANDA
        </span>

        <div className="pedido-remitente-body">
          <div className="pedido-remitente-avatar" aria-hidden="true">
            {(cart.sender_name || "?").trim().charAt(0).toUpperCase()}
          </div>

          <div className="pedido-remitente-info">
            <strong>
              {cart.sender_name ||
                "Alguien de SportCrz"}
            </strong>

            {cart.sender_phone ? (
              <span className="pedido-remitente-phone">
                {cart.sender_phone}
              </span>
            ) : null}
          </div>

          {cart.sender_phone ? (
            <a
              className="pedido-remitente-wa"
              href={`https://wa.me/${toWhatsAppNumber(
                cart.sender_phone
              )}?text=${encodeURIComponent(
                `Hola! Soy yo, vi el pedido que me mandaste 😄`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ESCRIBIRLE
            </a>
          ) : null}
        </div>
      </section>

      {/* LISTA */}

      <section className="pedido-items">
        {cart.items.map((item, index) => (
          <article className="pedido-item" key={item.id}>
            {item.image ? (
              <img src={item.image} alt={item.product_name} />
            ) : (
              <div className="pedido-item-fallback" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
            )}

            <div className="pedido-item-info">
              <span className="pedido-item-qty">
                {item.quantity} {item.quantity === 1 ? "UNIDAD" : "UNIDADES"}
              </span>

              <h3>{item.product_name}</h3>

              <span className="pedido-item-price">
                {money(item.unit_price * item.quantity)}
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* TOTAL */}

      <section className="pedido-total">
        <div className="pedido-total-row">
          <span>
            {unitCount} {unitCount === 1 ? "ARTICULO" : "ARTICULOS"}
          </span>
          <strong>{money(cart.total)}</strong>
        </div>

        <p className="pedido-total-note">
          Envio e impuestos se coordinan por WhatsApp.
        </p>
      </section>

      {/* NOTA DEL REMITENTE */}

      {cart.note ? (
        <section className="pedido-note">
          <span>MENSAJE</span>
          <p>{cart.note}</p>
        </section>
      ) : null}

      {/* ACCION */}

      <section className="pedido-actions">
        {error ? <p className="pedido-error">{error}</p> : null}

        {status === "confirmed" ? (
          <div className="pedido-done">
            <strong>¡PEDIDO CONFIRMADO!</strong>
            <span>
              Te vamos a escribir para coordinar la entrega y el pago.
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="pedido-confirm"
              onClick={handleConfirm}
              disabled={sending}
            >
              <span>
                {sending
                  ? "ENVIANDO..."
                  : STORE_WHATSAPP
                    ? "CONFIRMAR POR WHATSAPP"
                    : "CONFIRMAR PEDIDO"}
              </span>

              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              className="pedido-copy"
              onClick={handleCopy}
            >
              {copied ? "¡COPIADO!" : "O COPIAR LA LISTA"}
            </button>
          </>
        )}

        {!STORE_WHATSAPP && status !== "confirmed" ? (
          <p className="pedido-hint">
            La tienda aun no configuro su numero de WhatsApp. Usa
            &quot;O COPIAR LA LISTA&quot; y enviala por donde quieras.
          </p>
        ) : null}
      </section>
    </>
  );
}