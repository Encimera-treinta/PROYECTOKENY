"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";

export type CartItem = {
  id: number | null;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  open: boolean;
  setOpen: (value: boolean) => void;
  add: (product: Omit<CartItem, "quantity">) => void;
  inc: (index: number) => void;
  dec: (index: number) => void;
  remove: (index: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext =
  createContext<CartContextType | null>(null);

const CART_STORAGE_KEY =
  "sportcrz_cart";

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] =
    useState<CartItem[]>([]);

  const [open, setOpen] =
    useState(false);

  const [hydrated, setHydrated] =
    useState(false);

  /* =====================================
     LOAD CART
  ===================================== */

  useEffect(() => {
    try {
      const storedCart =
        localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (storedCart) {
        const parsed =
          JSON.parse(storedCart);

        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      setItems([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  /* =====================================
     SAVE CART
  ===================================== */

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch {
      // El carrito sigue funcionando
      // en memoria si localStorage falla.
    }
  }, [items, hydrated]);

  /* =====================================
     BODY LOCK + ESC
  ===================================== */

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        "";

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  /* =====================================
     ADD
  ===================================== */

  const add = (
    product: Omit<
      CartItem,
      "quantity"
    >
  ) => {
    setItems((current) => {
      const existingIndex =
        current.findIndex(
          (item) =>
            item.name ===
            product.name
        );

      if (
        existingIndex === -1
      ) {
        return [
          ...current,
          {
            ...product,
            quantity: 1,
          },
        ];
      }

      return current.map(
        (item, itemIndex) =>
          itemIndex ===
          existingIndex
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
      );
    });

    setOpen(true);
  };

  /* =====================================
     DERIVED VALUES
  ===================================== */

  const count = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + item.quantity,
        0
      ),
    [items]
  );

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.quantity,
        0
      ),
    [items]
  );

  /* =====================================
     CONTEXT
  ===================================== */

  const value =
    useMemo<CartContextType>(
      () => ({
        items,
        open,
        setOpen,
        add,

        inc: (index) => {
          setItems((current) =>
            current.map(
              (
                item,
                itemIndex
              ) =>
                itemIndex ===
                index
                  ? {
                      ...item,
                      quantity:
                        item.quantity +
                        1,
                    }
                  : item
            )
          );
        },

        dec: (index) => {
          setItems((current) =>
            current.flatMap(
              (
                item,
                itemIndex
              ) => {
                if (
                  itemIndex !==
                  index
                ) {
                  return [item];
                }

                if (
                  item.quantity <= 1
                ) {
                  return [];
                }

                return [
                  {
                    ...item,
                    quantity:
                      item.quantity -
                      1,
                  },
                ];
              }
            )
          );
        },

        remove: (index) => {
          setItems((current) =>
            current.filter(
              (
                _,
                itemIndex
              ) =>
                itemIndex !==
                index
            )
          );
        },

        clear: () => {
          setItems([]);
        },

        count,
        total,
      }),
      [
        items,
        open,
        count,
        total,
      ]
    );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}

      <CartDrawer />
    </CartContext.Provider>
  );
}

/* =====================================
   HOOK
===================================== */

export function useCart() {
  const cart =
    useContext(CartContext);

  if (!cart) {
    throw new Error(
      "CartProvider missing"
    );
  }

  return cart;
}

/* =====================================
   DRAWER
===================================== */

function CartDrawer() {
  const cart = useCart();

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar carrito"
        className={`cart-overlay ${
          cart.open
            ? "active"
            : ""
        }`}
        onClick={() =>
          cart.setOpen(false)
        }
      />

      <aside
        className={`cart-sidebar ${
          cart.open
            ? "active"
            : ""
        }`}
        aria-hidden={
          !cart.open
        }
      >
        {/* HEADER */}

        <div className="cart-header">
          <div>
            <span className="cart-eyebrow">
              SPORTCRZ / BAG
            </span>

            <h2>
              TU CARRITO
            </h2>
          </div>

          <button
            type="button"
            className="close-cart"
            onClick={() =>
              cart.setOpen(false)
            }
            aria-label="Cerrar carrito"
          >
            <span>×</span>
          </button>
        </div>

        {/* META */}

        <div className="cart-meta">
          <span>
            {String(
              cart.count
            ).padStart(
              2,
              "0"
            )}{" "}
            {cart.count === 1
              ? "ARTÍCULO"
              : "ARTÍCULOS"}
          </span>

          <span>
            SPORTCRZ / 2026
          </span>
        </div>

        {/* ITEMS */}

        <div className="cart-items-container">
          {cart.items.length ===
          0 ? (
            <div className="empty-cart">
              <span>
                00 / EMPTY
              </span>

              <h3>
                TU CARRITO
                <br />
                ESTÁ VACÍO.
              </h3>

              <p>
                Encuentra una pieza
                y agrégala a tu
                selección.
              </p>

              <button
                type="button"
                onClick={() =>
                  cart.setOpen(
                    false
                  )
                }
              >
                SEGUIR EXPLORANDO
                ↗
              </button>
            </div>
          ) : (
            cart.items.map(
              (
                item,
                index
              ) => (
                <article
                  className="cart-item"
                  key={`${item.name}-${index}`}
                >
                  <div className="cart-item-image">
                    <img
                      src={
                        item.image
                      }
                      alt={
                        item.name
                      }
                    />

                    <span>
                      {String(
                        index +
                          1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>
                  </div>

                  <div className="cart-item-info">
                    <div className="cart-item-top">
                      <div>
                        <span className="cart-item-category">
                          SPORTCRZ
                        </span>

                        <h4>
                          {
                            item.name
                          }
                        </h4>
                      </div>

                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() =>
                          cart.remove(
                            index
                          )
                        }
                        aria-label={`Eliminar ${item.name}`}
                      >
                        REMOVE
                      </button>
                    </div>

                    <div className="cart-item-bottom">
                      <div className="cart-quantity">
                        <button
                          type="button"
                          onClick={() =>
                            cart.dec(
                              index
                            )
                          }
                          aria-label="Reducir cantidad"
                        >
                          −
                        </button>

                        <span>
                          {String(
                            item.quantity
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            cart.inc(
                              index
                            )
                          }
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-prices">
                        <span className="cart-unit-price">
                          $
                          {item.price.toFixed(
                            2
                          )}{" "}
                          EA
                        </span>

                        <strong>
                          $
                          {(
                            item.price *
                            item.quantity
                          ).toFixed(
                            2
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>
              )
            )
          )}
        </div>

        {/* FOOTER */}

        {cart.items.length >
          0 && (
          <div className="cart-footer">
            <div className="cart-summary-line">
              <span>
                SUBTOTAL
              </span>

              <strong>
                $
                {cart.total.toFixed(
                  2
                )}
              </strong>
            </div>

            <p className="cart-note">
              Envío e impuestos se
              calcularán durante el
              checkout.
            </p>

            <Link
              href="/checkout"
              className="checkout-btn"
              onClick={() => cart.setOpen(false)}
            >
              <span>
                FINALIZAR COMPRA
              </span>

              <span>↗</span>
            </Link>

            <button
              type="button"
              className="clear-cart-btn"
              onClick={
                cart.clear
              }
            >
              VACIAR CARRITO
            </button>
          </div>
        )}
      </aside>
    </>
  );
}