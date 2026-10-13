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
  /* false mientras se lee el carrito del
     navegador. Sirve para no mostrar el
     aviso de "carrito vacio" un instante
     antes de que aparezca el contenido. */
  hydrated: boolean;
};

const CartContext =
  createContext<CartContextType | null>(null);

const CART_STORAGE_KEY =
  "sportcrz_cart";

/* Destino de los pedidos por WhatsApp: el numero configurado en
   NEXT_PUBLIC_STORE_WHATSAPP (formato internacional, sin +). */
const STORE_WHATSAPP = (
  process.env.NEXT_PUBLIC_STORE_WHATSAPP || ""
).replace(/\D/g, "");

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

        hydrated,
      }),
      [
        items,
        open,
        count,
        total,
        hydrated,
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

/* =====================================
   COMPARTIR CARRITO POR WHATSAPP
   Genera un link /pedido/CODE y abre
   WhatsApp con el texto listo.
===================================== */

type ShareState = "idle" | "sending" | "done" | "error";

type ShareMe = {
  authenticated: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
};

function ShareCartPanel() {
  const cart = useCart();
  const [state, setState] =
    useState<ShareState>("idle");
  const [url, setUrl] =
    useState("");
  const [error, setError] =
    useState("");
  const [open, setOpen] =
    useState(false);

  /* Datos de quien comparte: se completan solos con la sesion
     y se pueden editar antes de mandar. */
  const [me, setMe] =
    useState<ShareMe | null>(null);
  const [senderName, setSenderName] =
    useState("");
  const [senderPhone, setSenderPhone] =
    useState("");

  useEffect(() => {
    fetch("/api/customer/me")
      .then((r) => r.json())
      .then((data: ShareMe) => {
        setMe(data);

        if (!data.authenticated) return;

        const nombre = [
          data.firstName,
          data.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        if (nombre) setSenderName(nombre);
        if (data.phone) setSenderPhone(data.phone);
      })
      .catch(() => setMe(null));
  }, [open]);

  async function handleShare() {
    if (state === "sending") return;

    setState("sending");
    setError("");

    try {
      const response = await fetch(
        "/api/shared-cart",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            sender_name: senderName.trim(),
            sender_phone:
              senderPhone.trim(),
            items: cart.items.map(
              (item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
              })
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.code) {
        setState("error");
        setError(
          data.error ||
            "No se pudo generar el link."
        );

        return;
      }

      const origin =
        window.location.origin;

      const shareUrl =
        `${origin}/pedido/${data.code}`;

      const text =
        `Hola! Estas son las prendas que elegi para vos en SportCrz 😄\n\n` +
        `Revisá la lista acá: ${shareUrl}`;

      setUrl(shareUrl);
      setState("done");

      /* Con numero configurado abre el chat directo; sin numero,
         cae en el selector de contactos de WhatsApp. */
      const whatsappHref = STORE_WHATSAPP
        ? `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(
            text
          )}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;

      window.open(
        whatsappHref,
        "_blank",
        "noopener,noreferrer"
      );
    } catch {
      setState("error");
      setError(
        "Error de conexión. Intenta de nuevo."
      );
    }
  }

  async function handleCopy() {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError(
        "No se pudo copiar. Copia el link a mano."
      );
    }
  }

  return (
    <div className="share-panel">
      {!open && state !== "done" ? (
        <button
          type="button"
          className="share-toggle"
          onClick={() => setOpen(true)}
        >
          ¿MANDARSELO A ALGUIEN?
        </button>
      ) : null}

      {open && state !== "done" ? (
        <>
          <p className="share-explainer">
            Crea un link con tu carrito y
            mandalo por WhatsApp. Quien lo
            abra ve la lista y confirma. Sin
            cuenta y sin pagar por la página.
          </p>

          <div className="share-fields">
            <div className="share-field">
              <label htmlFor="share-name">
                QUIEN LO MANDA
              </label>

              <input
                id="share-name"
                type="text"
                value={senderName}
                onChange={(event) =>
                  setSenderName(event.target.value)
                }
                placeholder="Tu nombre"
                maxLength={80}
              />
            </div>

            <div className="share-field">
              <label htmlFor="share-phone">
                TU WHATSAPP
              </label>

              <input
                id="share-phone"
                type="tel"
                inputMode="tel"
                value={senderPhone}
                onChange={(event) =>
                  setSenderPhone(event.target.value)
                }
                placeholder="Opcional"
                maxLength={20}
              />
            </div>
          </div>

          {me?.authenticated && !senderPhone ? (
            <p className="share-hint">
              Pone tu numero si queres que te
              escriba directo a vos.
            </p>
          ) : null}

          {error ? (
            <p className="share-error">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            className="share-btn"
            onClick={handleShare}
            disabled={
              state === "sending" ||
              !senderName.trim()
            }
          >
            {state === "sending"
              ? "GENERANDO..."
              : "MANDAR POR WHATSAPP"}
          </button>

          {!senderName.trim() ? (
            <p className="share-hint">
              Escribi tu nombre para que sepa
              quien le manda esto.
            </p>
          ) : null}

          <button
            type="button"
            className="share-cancel"
            onClick={() => setOpen(false)}
          >
            CERRAR
          </button>
        </>
      ) : null}

      {state === "done" && url ? (
        <div className="share-done">
          <span className="share-done-label">
            LINK CREADO
          </span>

          <input
            className="share-url"
            readOnly
            value={url}
            onFocus={(event) =>
              event.currentTarget.select()
            }
            aria-label="Link del pedido"
          />

          <div className="share-done-actions">
            <button
              type="button"
              className="share-btn"
              onClick={handleCopy}
            >
              COPIAR LINK
            </button>

            <button
              type="button"
              className="share-cancel"
              onClick={() => {
                setState("idle");
                setOpen(false);
                setUrl("");
              }}
            >
              CERRAR
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
          {/* Antes de leer el navegador no sabemos si hay
             items: se muestra un hueco en vez de decir
             "esta vacio" y contradictedespues. */}
          {!cart.hydrated ? (
            <div
              className="empty-cart"
              aria-hidden="true"
            />
          ) : cart.items.length ===
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
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    ) : (
                      <span className="cart-item-noimg">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>
                    )}

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

        {cart.hydrated &&
          cart.items.length >
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

              <span></span>
            </Link>

            <ShareCartPanel />

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