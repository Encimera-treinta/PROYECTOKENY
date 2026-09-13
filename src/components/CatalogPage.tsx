"use client";

import Link from "next/link";
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

  return (
    <main className="catalog-page">
      {/* =====================================
          HEADER
      ===================================== */}

      <section className="catalog-header">
        <div className="catalog-header-top">
          <span>SPORTCRZ / 2026</span>

          <span>
            {String(totalProducts).padStart(2, "0")} PRODUCTOS
          </span>
        </div>

        <div className="catalog-title-row">
          <h1>{label}</h1>

          <p>
            MOVIMIENTO.
            <br />
            ACTITUD.
            <br />
            SPORTCRZ.
          </p>
        </div>

        <nav
          className="catalog-category-nav"
          aria-label="Categorías"
        >
          <Link
            href="/mujeres"
            className={
              currentCategory === "mujeres"
                ? "active"
                : ""
            }
          >
            MUJERES
          </Link>

          <Link
            href="/hombres"
            className={
              currentCategory === "hombres"
                ? "active"
                : ""
            }
          >
            HOMBRES
          </Link>

          <Link
            href="/ninos"
            className={
              currentCategory === "niños" ||
              currentCategory === "ninos"
                ? "active"
                : ""
            }
          >
            NIÑOS
          </Link>

          <Link
            href="/rebajas"
            className={
              currentCategory === "rebajas"
                ? "active"
                : ""
            }
          >
            REBAJAS
          </Link>
        </nav>
      </section>

      {/* =====================================
          PRODUCTOS
      ===================================== */}

      <div className="catalog-content">
        {sections.map((section, sectionIndex) => (
          <section
            className="catalog-product-section"
            id={section.id}
            key={section.id}
          >
            <div className="catalog-section-top">
              <div>
                <span>
                  {String(sectionIndex + 1).padStart(2, "0")}
                </span>

                <h2>{section.title}</h2>
              </div>

              <span>
                {String(section.products.length).padStart(2, "0")} ITEMS
              </span>
            </div>

            <div className="experimental-grid">
              {section.products.map((product, index) => {
                const isLarge = index % 7 === 2;
                const isWide = index % 9 === 5;

                return (
                  <article
                    className={[
                      "experimental-product",
                      isLarge ? "product-large" : "",
                      isWide ? "product-wide" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={`${product.name}-${index}`}
                  >
                    <div className="experimental-image">
                      <Link
                        href={`/producto/${product.id}`}
                        className="experimental-image-link"
                        aria-label={`Ver detalles de ${product.name}`}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                        />
                      </Link>

                      <span className="experimental-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {sale && product.badge && (
                        <span className="experimental-sale">
                          {product.badge}
                        </span>
                      )}

                      <button
                        type="button"
                        className="experimental-add"
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
                        <span className="add-symbol">+</span>

                        <span className="add-text">
                          AGREGAR
                        </span>
                      </button>
                    </div>

                    <div className="experimental-info">
                      <div>
                        <span className="experimental-category">
                          SPORTCRZ / {label.toUpperCase()}
                        </span>

                        <h3>
                          <Link href={`/producto/${product.id}`} className="experimental-title-link">
                            {product.name}
                          </Link>
                        </h3>
                      </div>

                      <div className="experimental-price">
                        {sale && product.oldPrice ? (
                          <>
                            <span className="price-old">
                              ${product.oldPrice.toFixed(2)}
                            </span>

                            <span className="price-new">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span>
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
          MANIFESTO
      ===================================== */}

      <section className="catalog-manifesto">
        <span>SPORTCRZ / MOVEMENT</span>

        <h2>
          WEAR
          <br />
          YOUR
          <br />
          ATTITUDE.
        </h2>

        <div className="catalog-manifesto-bottom">
          <p>
            NO ES SUERTE.
            <br />
            ES SPORTCRZ.
          </p>

          <Link href="/">
            VOLVER A SPORTCRZ
          </Link>
        </div>
      </section>

      {/* =====================================
          CART
      ===================================== */}

      <button
        type="button"
        className="catalog-floating-cart"
        onClick={() => cart.setOpen(true)}
        aria-label={`Abrir carrito con ${cart.count} productos`}
      >
        <span>CART</span>

        <span>
          {String(cart.count).padStart(2, "0")}
        </span>
      </button>
    </main>
  );
}