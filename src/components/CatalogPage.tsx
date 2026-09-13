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

  /* Animaciones de revista: títulos que se expanden,
     tarjetas con reveal escalonado, marquesina continua. */
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");

      ctx = gsap.context(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          return;
        }

        /* Título gigante: entra con escala y tracking */
        gsap.fromTo(
          ".rv-hero-title",
          { scale: 1.18, opacity: 0, filter: "blur(14px)" },
          {
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.2,
            ease: "expo.out",
          }
        );

        gsap.fromTo(
          ".rv-hero-meta, .rv-nav",
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.35,
          }
        );

        gsap.fromTo(
          ".rv-card",
          { y: 90, opacity: 0, rotate: -1.5 },
          {
            y: 0,
            opacity: 1,
            rotate: 0,
            duration: 1,
            stagger: 0.09,
            ease: "power4.out",
            delay: 0.5,
          }
        );

        /* Tarjetas responden al movimiento del mouse (tilt sutil) */
        const cards = document.querySelectorAll<HTMLElement>(".rv-card");

        cards.forEach((card) => {
          const media = card.querySelector<HTMLElement>(".rv-media");

          if (!media) return;

          card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            gsap.to(media, {
              rotateY: x * 7,
              rotateX: -y * 7,
              duration: 0.5,
              ease: "power2.out",
              transformPerspective: 900,
            });
          });

          card.addEventListener("mouseleave", () => {
            gsap.to(media, {
              rotateX: 0,
              rotateY: 0,
              duration: 0.7,
              ease: "power3.out",
            });
          });
        });
      });
    })();

    return () => ctx?.revert();
  }, [label]);

  return (
    <main className="rv-catalog">
      {/* =====================================
          MARQUESINA SUPERIOR
      ===================================== */}
      <div className="rv-marquee" aria-hidden="true">
        <div className="rv-marquee-track">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="rv-marquee-seq">
              <span>SPORTCRZ</span>
              <span className="rv-dot" />
              <span>{label.toUpperCase()}</span>
              <span className="rv-dot" />
              <span>{String(totalProducts).padStart(2, "0")} PIEZAS</span>
              <span className="rv-dot" />
              <span>ENVÍOS EN PANAMÁ</span>
              <span className="rv-dot" />
              <span>TARJETA & YAPPY</span>
              <span className="rv-dot" />
            </span>
          ))}
        </div>
      </div>

      {/* =====================================
          HERO
      ===================================== */}
      <header className="rv-hero">
        <div className="rv-hero-meta">
          <span>COLECCIÓN / 2026</span>
          <span>REVISTA Nº {String(totalProducts).padStart(2, "0")}</span>
        </div>

        <h1 className="rv-hero-title">{label}</h1>

        <nav className="rv-nav" aria-label="Categorías">
          <Link
            href="/mujeres"
            className={currentCategory === "mujeres" ? "active" : ""}
          >
            MUJERES
          </Link>
          <span className="rv-nav-sep">/</span>
          <Link
            href="/hombres"
            className={currentCategory === "hombres" ? "active" : ""}
          >
            HOMBRES
          </Link>
          <span className="rv-nav-sep">/</span>
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
          <span className="rv-nav-sep">/</span>
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
      <div className="rv-content">
        {sections.map((section, sectionIndex) => (
          <section className="rv-section" id={section.id} key={section.id}>
            <div className="rv-section-head">
              <span className="rv-section-num">
                {String(sectionIndex + 1).padStart(2, "0")}
              </span>
              <h2 className="rv-section-title">{section.title}</h2>
              <span className="rv-section-count">
                {String(section.products.length).padStart(2, "0")} ITEMS
              </span>
            </div>

            <div className="rv-grid">
              {section.products.map((product, index) => {
                /* Patrón editorial: cada 5ª tarjeta cruza el ancho */
                const feature = index % 5 === 2;

                return (
                  <article
                    className={`rv-card${feature ? " feature" : ""}`}
                    key={`${product.name}-${index}`}
                  >
                    <div className="rv-media">
                      <Link
                        href={`/producto/${product.id}`}
                        className="rv-media-link"
                        aria-label={`Ver ${product.name}`}
                      >
                        <img src={product.image} alt={product.name} />
                      </Link>

                      <span className="rv-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {sale && product.badge && (
                        <span className="rv-badge">{product.badge}</span>
                      )}

                      <button
                        type="button"
                        className="rv-add"
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
                        + CARRITO
                      </button>
                    </div>

                    <div className="rv-info">
                      <Link
                        href={`/producto/${product.id}`}
                        className="rv-name"
                      >
                        {product.name}
                      </Link>

                      <div className="rv-price">
                        {sale && product.oldPrice ? (
                          <>
                            <span className="rv-price-old">
                              {product.oldPrice.toFixed(2)}
                            </span>
                            <span className="rv-price-now">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="rv-price-now">
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
      <section className="rv-close">
        <div className="rv-close-circle" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <defs>
              <path
                id="rvCircle"
                d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"
              />
            </defs>
            <text>
              <textPath href="#rvCircle">
                SPORTCRZ — NO ES SUERTE — ES ENTRENAMIENTO —
              </textPath>
            </text>
          </svg>
        </div>

        <h2 className="rv-close-title">
          HECHO
          <br />
          PARA
          <br />
          GANAR.
        </h2>

        <Link href="/" className="rv-close-link">
          VOLVER AL INICIO
        </Link>
      </section>

      {/* =====================================
          CARRITO FLOTANTE
      ===================================== */}
      <button
        type="button"
        className="rv-float"
        onClick={() => cart.setOpen(true)}
        aria-label={`Abrir carrito con ${cart.count} productos`}
      >
        <span className="rv-float-label">CART</span>
        <span className="rv-float-count">
          {String(cart.count).padStart(2, "0")}
        </span>
      </button>
    </main>
  );
}
