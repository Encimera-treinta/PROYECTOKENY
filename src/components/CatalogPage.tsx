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

  /* Entrada editorial: instantánea y suave.
     GSAP solo con stagger corto — sin pantallas de carga. */
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");

      ctx = gsap.context(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }

        gsap.fromTo(
          ".sw-title-line",
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.06,
          }
        );

        gsap.fromTo(
          ".sw-head-row",
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.05,
          }
        );

        gsap.fromTo(
          ".sw-card",
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.045,
          }
        );
      });
    })();

    return () => ctx?.revert();
  }, [label]);

  return (
    <main className="sw-page">
      {/* =====================================
          HEADER EDITORIAL
      ===================================== */}
      <header className="sw-head">
        <div className="sw-head-row sw-head-meta">
          <span>SPORTCRZ — 2026</span>
          <span>{String(totalProducts).padStart(2, "0")} PIEZAS</span>
        </div>

        <h1 className="sw-title">
          <span className="sw-title-mask">
            <span className="sw-title-line">{label}</span>
          </span>
        </h1>

        {/* Navegación por texto — editorial de moda */}
        <nav className="sw-cats sw-head-row" aria-label="Categorías">
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
      <div className="sw-content">
        {sections.map((section) => (
          <section className="sw-section" id={section.id} key={section.id}>
            <div className="sw-section-head sw-head-row">
              <h2>{section.title}</h2>
              <span>{String(section.products.length).padStart(2, "0")}</span>
            </div>

            <div className="sw-grid">
              {section.products.map((product, index) => (
                <article
                  className="sw-card"
                  key={`${product.name}-${index}`}
                >
                  <div className="sw-media">
                    <Link
                      href={`/producto/${product.id}`}
                      className="sw-media-link"
                      aria-label={`Ver ${product.name}`}
                    >
                      <img src={product.image} alt={product.name} />
                    </Link>

                    {sale && product.badge && (
                      <span className="sw-badge">{product.badge}</span>
                    )}

                    <button
                      type="button"
                      className="sw-add"
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

                  <div className="sw-info">
                    <Link
                      href={`/producto/${product.id}`}
                      className="sw-name"
                    >
                      {product.name}
                    </Link>

                    <div className="sw-price">
                      {sale && product.oldPrice ? (
                        <span className="sw-price-old">
                          ${product.oldPrice.toFixed(2)}
                        </span>
                      ) : null}
                      <span className="sw-price-now">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* =====================================
          CIERRE EDITORIAL
      ===================================== */}
      <section className="sw-close sw-head-row">
        <div className="sw-close-inner">
          <p>MOVIMIENTO / ACTITUD / SPORTCRZ</p>
          <h2>
            DISEÑADO
            <br />
            PARA MOVERSE.
          </h2>
          <div className="sw-close-cta">
            <Link href="/" className="sw-close-link">
              VOLVER AL INICIO
            </Link>
            <button
              type="button"
              className="sw-cart-btn"
              onClick={() => cart.setOpen(true)}
            >
              CARRITO — {String(cart.count).padStart(2, "0")}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
