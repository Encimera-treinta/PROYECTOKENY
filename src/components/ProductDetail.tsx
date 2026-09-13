"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/database";
import { useCart } from "./CartProvider";

const CATEGORY_LABELS: Record<string, string> = {
  mujeres: "MUJERES",
  hombres: "HOMBRES",
  ninos: "NIÑOS",
  rebajas: "REBAJAS",
};

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export default function ProductDetail({
  product,
}: {
  product: Product;
}) {
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);

  const categoryLabel =
    CATEGORY_LABELS[product.category] ?? product.category.toUpperCase();
  const hasDiscount =
    product.old_price != null && product.old_price > product.price;
  const outOfStock = product.stock <= 0;

  /* GSAP: entrada tipo Apple/Pagani — imagen revelada,
     texto escalonado, parallax sutil al scroll. */
  useEffect(() => {
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReduced) return;

        /* 1. Revelado inicial */
        gsap.set(".pd-media-frame", { clipPath: "inset(0 0 100% 0)" });
        gsap.set(".pd-info > *", { y: 34, opacity: 0 });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.to(".pd-media-frame", {
          clipPath: "inset(0 0 0% 0)",
          duration: 1.15,
          ease: "expo.out",
        }).to(
          ".pd-info > *",
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.085,
          },
          "-=0.72"
        );

        /* 2. Parallax de imagen al scroll */
        gsap.to(".pd-media-img", {
          yPercent: 9,
          ease: "none",
          scrollTrigger: {
            trigger: ".pd-stage",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        /* 3. Contenido post-stage entra al viewport */
        gsap.from(".pd-section", {
          y: 46,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".pd-after",
            start: "top 78%",
          },
        });

        /* 4. Contador de precio dramático */
        const priceEl = document.querySelector<HTMLElement>(".pd-price-final");
        if (priceEl && hasDiscount) {
          const obj = { v: product.old_price ?? product.price };
          gsap.to(obj, {
            v: product.price,
            duration: 1.4,
            delay: 0.9,
            ease: "power2.out",
            onUpdate: () => {
              priceEl.textContent = `$${obj.v.toFixed(2)}`;
            },
          });
        }
      });
    })();

    return () => ctx?.revert();
  }, [hasDiscount, product.old_price, product.price]);

  function handleAdd() {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    cart.add({
      id: product.id,
      name: `${product.name} · TALLE ${selectedSize}`,
      price: product.price,
      image: product.image,
    });
    setAdded(true);
    cart.setOpen(true);
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <main className="pd-page">
      {/* ==============================
          STAGE (hero a pantalla completa
          bajo el navbar global)
      ============================== */}
      <section className="pd-stage">
        <div className="pd-stage-grid">
          {/* IMAGEN */}
          <figure className="pd-media">
            <div className="pd-media-frame">
              <img
                src={product.image}
                alt={product.name}
                className="pd-media-img"
              />
            </div>
            {product.badge && (
              <span className="pd-badge">{product.badge}</span>
            )}
            <figcaption className="pd-ref">
              SCZ-{String(product.id).padStart(4, "0")} / {categoryLabel}
            </figcaption>
          </figure>

          {/* INFO */}
          <div className="pd-info">
            <p className="pd-kicker">
              SPORTCRZ / {categoryLabel} / 2026
            </p>

            <h1 className="pd-title">{product.name}</h1>

            <div className="pd-price">
              {hasDiscount && (
                <span className="pd-price-old">
                  ${product.old_price?.toFixed(2)}
                </span>
              )}
              <span className="pd-price-final">
                ${product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="pd-save">
                  −${(product.old_price! - product.price).toFixed(2)}
                </span>
              )}
            </div>

            <p className={`pd-stock ${outOfStock ? "out" : "in"}`}>
              {outOfStock
                ? "AGOTADO"
                : `EN EXISTENCIA — ${product.stock} UNIDADES`}
            </p>

            {/* TALLES */}
            <div className={`pd-sizes ${sizeError ? "error" : ""}`}>
              <p className="pd-sizes-label">
                TALLE {selectedSize ? `— ${selectedSize}` : ""}
              </p>
              <div className="pd-sizes-row">
                {SIZE_ORDER.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`pd-size ${
                      selectedSize === size ? "active" : ""
                    }`}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="pd-sizes-hint">SELECCIONA UN TALLE</p>
              )}
            </div>

            {/* CTA */}
            <div className="pd-cta">
              <button
                type="button"
                className="pd-add"
                onClick={handleAdd}
                disabled={outOfStock}
              >
                {added
                  ? "AÑADIDO AL CARRITO"
                  : outOfStock
                    ? "SIN STOCK"
                    : "AÑADIR AL CARRITO"}
                <span className="pd-add-dot" aria-hidden="true" />
              </button>
              <Link href="/carrito" className="pd-cart-link">
                VER CARRITO — {String(cart.count).padStart(2, "0")}
              </Link>
            </div>

            <p className="pd-back">
              <Link href={`/${product.category}`}>
                VOLVER A {categoryLabel}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ==============================
          CONTENIDO DESPUÉS DEL STAGE
      ============================== */}
      <div className="pd-after">
        {/* DESCRIPCIÓN */}
        <section className="pd-section pd-desc">
          <span className="pd-index">01 / DESCRIPCIÓN</span>
          {product.description ? (
            <p className="pd-desc-text">{product.description}</p>
          ) : (
            <p className="pd-desc-text pd-desc-empty">
              Esta pieza aún no tiene descripción. Explora la colección{" "}
              {categoryLabel} completa en SportCrz.
            </p>
          )}
        </section>

        {/* FICHA */}
        <section className="pd-section pd-specs">
          <span className="pd-index">02 / FICHA TÉCNICA</span>
          <dl>
            <div>
              <dt>REFERENCIA</dt>
              <dd>SCZ-{String(product.id).padStart(4, "0")}</dd>
            </div>
            <div>
              <dt>CATEGORÍA</dt>
              <dd>{categoryLabel}</dd>
            </div>
            <div>
              <dt>PRECIO</dt>
              <dd>${product.price.toFixed(2)} USD</dd>
            </div>
            <div>
              <dt>DISPONIBILIDAD</dt>
              <dd>{outOfStock ? "AGOTADO" : `${product.stock} EN EXISTENCIA`}</dd>
            </div>
          </dl>
        </section>

        {/* CIERRE */}
        <section className="pd-section pd-close">
          <h2>
            WEAR
            <br />
            <span>YOUR</span>
            <br />
            ATTITUDE.
          </h2>
          <Link href={`/${product.category}`} className="pd-close-link">
            MÁS EN {categoryLabel}
          </Link>
        </section>
      </div>
    </main>
  );
}
