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

  /* Animaciones atleticas: barras de salida, dorsales,
     velocidad. */
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");

      ctx = gsap.context(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }

        /* Título: entra en diagonal atleta */
        gsap.fromTo(
          ".pm-hero-title",
          { x: -140, opacity: 0, skewX: -8 },
          {
            x: 0,
            opacity: 1,
            skewX: 0,
            duration: 0.9,
            ease: "power4.out",
          }
        );

        gsap.fromTo(
          ".pm-hero-tag, .pm-nav",
          { x: -60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.09,
            ease: "power3.out",
            delay: 0.25,
          }
        );

        /* Tarjetas: salida de atletismo */
        gsap.fromTo(
          ".pm-card",
          { x: 110, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.08,
            ease: "power4.out",
            delay: 0.4,
          }
        );

        /* Barra de velocidad inferior del hero */
        gsap.fromTo(
          ".pm-speed-bar i",
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.1,
            ease: "expo.out",
            delay: 0.55,
            transformOrigin: "left center",
          }
        );
      });
    })();

    return () => ctx?.revert();
  }, [label]);

  return (
    <main className="pm-catalog">
      {/* =====================================
          HERO ATHLETIC
      ===================================== */}
      <header className="pm-hero">
        <div className="pm-hero-meta">
          <span>FOREVER FASTER</span>
          <span>COLECCIÓN 2026</span>
          <span>{String(totalProducts).padStart(2, "0")} PIEZAS</span>
        </div>

        <h1 className="pm-hero-title">
          <span className="pm-title-main">{label}</span>
          <span className="pm-title-ghost" aria-hidden="true">
            {label}
          </span>
        </h1>

        <div className="pm-speed-bar" aria-hidden="true">
          <i />
        </div>

        <nav className="pm-nav" aria-label="Categorías">
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
      <div className="pm-content">
        {sections.map((section, sectionIndex) => (
          <section className="pm-section" id={section.id} key={section.id}>
            <div className="pm-section-head">
              <span className="pm-dorsal">
                {String(sectionIndex + 1).padStart(2, "0")}
              </span>
              <h2 className="pm-section-title">{section.title}</h2>
              <span className="pm-section-count">
                {String(section.products.length).padStart(2, "0")} ITEMS
              </span>
            </div>

            <div className="pm-grid">
              {section.products.map((product, index) => {
                /* Dorsal grande de atleta */
                const dorsal = String(index + 1).padStart(2, "0");

                return (
                  <article
                    className="pm-card"
                    key={`${product.name}-${index}`}
                  >
                    <div className="pm-media">
                      <Link
                        href={`/producto/${product.id}`}
                        className="pm-media-link"
                        aria-label={`Ver ${product.name}`}
                      >
                        <img src={product.image} alt={product.name} />
                      </Link>

                      <span className="pm-number">{dorsal}</span>

                      {sale && product.badge && (
                        <span className="pm-badge">{product.badge}</span>
                      )}

                      <button
                        type="button"
                        className="pm-add"
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

                    <div className="pm-info">
                      <div>
                        <Link
                          href={`/producto/${product.id}`}
                          className="pm-name"
                        >
                          {product.name}
                        </Link>
                        <span className="pm-cat">SPORTCRZ {label}</span>
                      </div>

                      <div className="pm-price">
                        {sale && product.oldPrice ? (
                          <>
                            <span className="pm-price-old">
                              ${product.oldPrice.toFixed(2)}
                            </span>
                            <span className="pm-price-now">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="pm-price-now">
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
      <section className="pm-close">
        <p className="pm-close-kicker">SPORTCRZ / MOVEMENT</p>
        <h2 className="pm-close-title">
          SIEMPRE
          <br />
          MÁS
          <br />
          RÁPIDO.
        </h2>
        <Link href="/" className="pm-close-link">
          VOLVER AL INICIO
        </Link>
      </section>

      {/* =====================================
          CARRITO FLOTANTE
      ===================================== */}
      <button
        type="button"
        className="pm-float"
        onClick={() => cart.setOpen(true)}
        aria-label={`Abrir carrito con ${cart.count} productos`}
      >
        <span className="pm-float-label">CARRITO</span>
        <span className="pm-float-count">
          {String(cart.count).padStart(2, "0")}
        </span>
      </button>
    </main>
  );
}
