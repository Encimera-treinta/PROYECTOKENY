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

  /* Animación de entrada: tarjetas aparecen en cascada. */
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");

      ctx = gsap.context(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }

        gsap.fromTo(
          ".zl-card",
          { y: 42, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.07,
            ease: "power3.out",
            delay: 0.15,
          }
        );

        gsap.fromTo(
          ".zl-head > *",
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
          }
        );
      });
    })();

    return () => ctx?.revert();
  }, [label]);

  return (
    <main className="zl-catalog">
      {/* =====================================
          HEADER
      ===================================== */}
      <header className="zl-head">
        <div className="zl-head-meta">
          <span>COLECCIÓN 2026</span>
          <span>{String(totalProducts).padStart(2, "0")} PIEZAS</span>
        </div>

        <h1 className="zl-head-title">{label}</h1>

        <p className="zl-head-sub">
          Rendimiento y diseño para cada movimiento.
        </p>

        <nav className="zl-cat-nav" aria-label="Categorías">
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
      <div className="zl-content">
        {sections.map((section, sectionIndex) => (
          <section
            className="zl-section"
            id={section.id}
            key={section.id}
          >
            <div className="zl-section-head">
              <span className="zl-section-count">
                {String(sectionIndex + 1).padStart(2, "0")}
              </span>
              <h2>{section.title}</h2>
              <span className="zl-section-items">
                {String(section.products.length).padStart(2, "0")} ITEMS
              </span>
            </div>

            <div className="zl-grid">
              {section.products.map((product, index) => {
                const wide = index % 7 === 3;

                return (
                  <article
                    className={`zl-card${wide ? " wide" : ""}`}
                    key={`${product.name}-${index}`}
                  >
                    <div className="zl-media">
                      <Link
                        href={`/producto/${product.id}`}
                        className="zl-media-link"
                        aria-label={`Ver ${product.name}`}
                      >
                        <img src={product.image} alt={product.name} />
                      </Link>

                      {sale && product.badge && (
                        <span className="zl-badge">{product.badge}</span>
                      )}

                      <button
                        type="button"
                        className="zl-add"
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
                        AÑADIR AL CARRITO
                      </button>
                    </div>

                    <div className="zl-info">
                      <Link
                        href={`/producto/${product.id}`}
                        className="zl-name"
                      >
                        {product.name}
                      </Link>

                      <div className="zl-price">
                        {sale && product.oldPrice ? (
                          <>
                            <span className="zl-price-old">
                              ${product.oldPrice.toFixed(2)}
                            </span>
                            <span className="zl-price-now">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="zl-price-now">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* =====================================
          CIERRE
      ===================================== */}
      <section className="zl-close">
        <div className="zl-close-inner">
          <p>SPORTCRZ — MOVEMENT</p>
          <h2>
            DISEÑADO
            <br />
            PARA
            <br />
            MOVERSE.
          </h2>
          <Link href="/" className="zl-close-link">
            VOLVER AL INICIO
          </Link>
        </div>
      </section>

      {/* =====================================
          CART FLOTANTE
      ===================================== */}
      <button
        type="button"
        className="zl-float-cart"
        onClick={() => cart.setOpen(true)}
        aria-label={`Abrir carrito con ${cart.count} productos`}
      >
        <span>CARRITO</span>
        <span className="zl-float-count">
          {String(cart.count).padStart(2, "0")}
        </span>
      </button>
    </main>
  );
}
