"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CarritoPage() {
  const cart = useCart();

  return (
    <main className="cart-route-page">
      <span>SPORTCRZ / BAG</span>
      <h1>TU<br />CARRITO.</h1>
      <p>
        {/* Mientras no sabemos si hay productos no se
            anuncia "no agregaste nada": se veria un
            segundo y despues cambiaria solo. */}
        {!cart.hydrated
          ? "CARGANDO TU CARRITO..."
          : cart.count === 0
            ? "TODAVÍA NO HAS AGREGADO PRODUCTOS."
            : `${cart.count} ${
                cart.count === 1
                  ? "ARTÍCULO"
                  : "ARTÍCULOS"
              } · $${cart.total.toFixed(2)}`}
      </p>
      <div>
        <button type="button" onClick={() => cart.setOpen(true)}>
          VER CARRITO <span></span>
        </button>
        <Link href="/mujeres">SEGUIR COMPRANDO</Link>
      </div>
    </main>
  );
}
