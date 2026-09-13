"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./CartProvider";

type Product = {
  id: number;
  name: string;
  price: number;
  oldPrice: number | null;
  image: string;
  badge: string | null;
};

type Section = {
  id: string;
  title: string;
  products: readonly Product[];
};

const CATEGORY_LABELS: Record<string, string> = {
  mujeres: "MUJERES",
  hombres: "HOMBRES",
  ninos: "NIÑOS",
  rebajas: "REBAJAS",
};

export default function CatalogPage({
  label,
  sections,
  sale = false,
}: {
  label: string;
  sections: readonly Section[];
  sale?: boolean;
}) {
  const cart = useCart();

  const totalProducts = sections.reduce(
    (total, section) => total + section.products.length,
    0
  );

  const currentCategory = label.toLowerCase();

  /* Animaciones estilo Apple: suaves, respetando reduced motion. */
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");

      ctx = gsap.context(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }

        gsap.fromTo(
          ".ap-large-title",
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }
        );

        gsap.fromTo(
          ".ap-segment, .ap-meta",
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            delay: 0.2,
          }
        );

        gsap.fromTo(
          ".ap-card",
          { y: 34, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            stagger: 0.06,
            ease: "power3.out",
            delay: 0.35,
          }
        );
      });
    })();

    return () => ctx?.revert();
  }, [label]);

  return (
    <main className="ap-page">
      {/* =====================================
          LARGE TITLE (iOS 26) + SEGMENTED
      ===================================== */}
      <header className="ap-header">
        <div className="ap-meta">
          <span>COLECCIÓN 2026</span>
          <span>{String(totalProducts).padStart(2, "0")} PIEZAS</span>
        </div>

        <h1 className="ap-large-title">{label}</h1>

        <nav className="ios-segment ap-segment" aria-label="Categorías">
          <Link
            href="/mujeres"
            className={currentCategory === "mujeres" ? "active" : ""}
          >
            MUJERES
          </Link>
          <Link
            href="/hombres"
            className={currentCategory === "hombres" ? "active" : ""}
          >
            HOMBRES
          </Link>
          <Link
            href="/ninos"
            className={
              currentCategory === "niños" || currentCategory === "ninos"
                ? "active"
                : ""
            }
          >
            NIÑOS
          </Link>
          <Link
            href="/rebajas"
            className={currentCategory === "rebajas" ? "active" : ""}
          >
            REBAJAS
          </Link>
        </nav>
      </header>

      {/* =====================================
          PRODUCTOS
      ===================================== */}
      <div className="ap-content">
        {sections.map((section) => (
          <section className="ap-section" id={section.id} key={section.id}>
            <div className="ap-section-head">
              <h2>{section.title}</h2>
              <span>{String(section.products.length).padStart(2, "0")} ITEMS</span>
            </div>

            <div className="ap-grid">
              {section.products.map((product, index) => (
                <article
                  className="ap-card ios-card"
                  key={`${product.name}-${index}`}
                >
                  <div className="ap-media">
                    <Link
                      href={`/producto/${product.id}`}
                      className="ap-media-link"
                      aria-label={`Ver ${product.name}`}
                    >
                      <img src={product.image} alt={product.name} />
                    </Link>

                    {sale && product.badge && (
                      <span className="ap-badge">{product.badge}</span>
                    )}
                  </div>

                  <div className="ap-info">
                    <Link
                      href={`/producto/${product.id}`}
                      className="ap-name"
                    >
                      {product.name}
                    </Link>

                    <div className="ap-price">
                      {sale && product.oldPrice ? (
                        <span className="ap-price-old">
                          ${product.oldPrice.toFixed(2)}
                        </span>
                      ) : null}
                      <span className="ap-price-now">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="ap-add"
                      onClick={() => {
                        cart.add({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                        });

                        cart.setOpen(true);
                      }}
                      aria-label={`Agregar ${product.name} al carrito`}
                    >
                      AÑADIR
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* =====================================
          CIERRE
      ===================================== */}
      <section className="ap-close ios-card">
        <p>SPORTCRZ — 2026</p>
        <h2>DISEÑADO PARA MOVERSE.</h2>
        <Link href="/" className="ap-close-link">
          VOLVER AL INICIO
        </Link>
      </section>

      {/* =====================================
          TAB BAR FLOTANTE iOS 26 (móvil)
          + CARRITO (desktop)
      ===================================== */}
      <nav className="ap-tabbar ios-glass thick" aria-label="Navegación rápida">
        <Link href="/" className="ap-tab">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <span>INICIO</span>
        </Link>

        <Link href="/mujeres" className="ap-tab">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M5 20c1.4-3.6 4-5.4 7-5.4s5.6 1.8 7 5.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>TIENDA</span>
        </Link>

        <button
          type="button"
          className="ap-tab ap-tab-cart"
          onClick={() => cart.setOpen(true)}
          aria-label={`Abrir carrito con ${cart.count} productos`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h2l2.2 10.2a1.6 1.6 0 0 0 1.6 1.3h7.4a1.6 1.6 0 0 0 1.6-1.2L20.6 10H7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="21" r="1.4" fill="currentColor" />
            <circle cx="17" cy="21" r="1.4" fill="currentColor" />
          </svg>
          <span>CARRITO</span>
          {cart.count > 0 && (
            <span className="ap-tab-badge">{String(cart.count).padStart(2, "0")}</span>
          )}
        </button>

        <Link href="/cuenta" className="ap-tab">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8.5" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M4.5 20.5c1.2-4 4.1-6 7.5-6s6.3 2 7.5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>CUENTA</span>
        </Link>
      </nav>
    </main>
  );
}
