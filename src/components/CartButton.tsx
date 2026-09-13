"use client";

import { useCart } from "./CartProvider";

/* Botón flotante de carrito: pastilla glass
   con el número de artículos. Abre el drawer. */
export default function CartButton() {
  const cart = useCart();

  return (
    <button
      type="button"
      className="cart-btn-float"
      onClick={() => cart.setOpen(true)}
      aria-label={`Abrir carrito con ${cart.count} artículos`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4.2 7.2h2.1l2 10a1.7 1.7 0 0 0 1.7 1.4h7.5a1.7 1.7 0 0 0 1.7-1.3l1.8-7.5H7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10.2" cy="21" r="1.5" fill="currentColor" />
        <circle cx="17" cy="21" r="1.5" fill="currentColor" />
      </svg>

      <span className="cart-btn-count">
        {String(cart.count).padStart(2, "0")}
      </span>
    </button>
  );
}
