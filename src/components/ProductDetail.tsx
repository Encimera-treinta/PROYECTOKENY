"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/database";
import { useCart } from "./CartProvider";

const CATEGORY_LABELS: Record<string, string> = {
  mujeres: "MUJERES",
  hombres: "HOMBRES",
  ninos: "NIÑOS",
  rebajas: "REBAJAS",
};

export default function ProductDetail({
  product,
}: {
  product: Product;
}) {
  const cart = useCart();
  const [added, setAdded] = useState(false);

  const categoryLabel =
    CATEGORY_LABELS[product.category] ?? product.category.toUpperCase();
  const hasDiscount =
    product.old_price != null && product.old_price > product.price;
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    cart.add({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setAdded(true);
    cart.setOpen(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <main className="product-detail-page">
      {/* ==============================
          TOPBAR
      ============================== */}
      <header className="product-detail-topbar">
        <span>SPORTCRZ / {categoryLabel}</span>
        <Link href={`/${product.category}`} className="product-detail-back">
          ← VOLVER A {categoryLabel}
        </Link>
      </header>

      {/* ==============================
          CUERPO
      ============================== */}
      <section className="product-detail-body">
        {/* IMAGEN */}
        <div className="product-detail-media">
          <img
            src={product.image}
            alt={product.name}
            className="product-detail-img"
          />
          {product.badge && (
            <span className="product-detail-badge">{product.badge}</span>
          )}
          <span className="product-detail-code">
            REF. SCZ-{String(product.id).padStart(4, "0")}
          </span>
        </div>

        {/* INFO */}
        <div className="product-detail-info">
          <span className="product-detail-kicker">
            SPORTCRZ / {categoryLabel} / 2026
          </span>

          <h1 className="product-detail-title">{product.name}</h1>

          <div className="product-detail-price">
            {hasDiscount ? (
              <>
                <span className="price-old">
                  ${product.old_price?.toFixed(2)}
                </span>
                <span className="price-new">
                  ${product.price.toFixed(2)}
                </span>
                <span className="product-detail-save">
                  AHORRAS $
                  {(product.old_price! - product.price).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="price-new">${product.price.toFixed(2)}</span>
            )}
          </div>

          <p className="product-detail-stock">
            {outOfStock ? (
              <span className="stock-out">AGOTADO</span>
            ) : (
              <span className="stock-in">
                EN EXISTENCIA · {product.stock} UNIDAD(ES)
              </span>
            )}
          </p>

          <div className="product-detail-actions">
            <button
              type="button"
              className="product-detail-add"
              onClick={handleAdd}
              disabled={outOfStock}
            >
              <span>{added ? "AÑADIDO ✓" : outOfStock ? "SIN STOCK" : "AÑADIR AL CARRITO"}</span>
              <span>{added ? "" : "+"}</span>
            </button>

            <Link
              href="/carrito"
              className="product-detail-cart-link"
            >
              VER CARRITO ({String(cart.count).padStart(2, "0")}) ↗
            </Link>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="product-detail-description">
            <span>01 / DESCRIPCIÓN</span>

            {product.description ? (
              <p>{product.description}</p>
            ) : (
              <p className="product-detail-empty">
                Todavía no hay descripción para esta prenda.
                Consigue esta y más piezas en la colección {categoryLabel} de
                SportCrz.
              </p>
            )}
          </div>

          {/* FICHA */}
          <div className="product-detail-specs">
            <span>02 / FICHA TÉCNICA</span>

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
                <dd>
                  {outOfStock
                    ? "AGOTADO"
                    : `${product.stock} EN EXISTENCIA`}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ==============================
          MANIFESTO
      ============================== */}
      <section className="product-detail-manifesto">
        <span>SPORTCRZ / MOVEMENT</span>
        <h2>
          WEAR
          <br />
          YOUR
          <br />
          ATTITUDE.
        </h2>
        <div className="product-detail-manifesto-bottom">
          <p>
            NO ES SUERTE.
            <br />
            ES SPORTCRZ.
          </p>
          <Link href={`/${product.category}`}>
            MÁS EN {categoryLabel} ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
