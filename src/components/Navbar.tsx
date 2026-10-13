"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] =
    useState(false);

  /* Arriba el navbar usa mix-blend-mode: difference y se
     invierte contra el fondo: ese es el efecto original.
     Al bajar, el contenido pasa por debajo y el logo se
     cruzaba con el texto de la pagina. A partir de cierto
     punto se pasa a fondo solido para que siempre se lea. */
  const [scrolled, setScrolled] =
    useState(false);

  const links = [
    {
      href: "/",
      label: "Inicio",
    },
    {
      href: "/hombres",
      label: "Hombres",
    },
    {
      href: "/mujeres",
      label: "Mujeres",
    },
    {
      href: "/ninos",
      label: "Niños",
    },
    {
      href: "/rebajas",
      label: "Rebajas",
    },
    {
      href: "/cuenta",
      label: "Mi Cuenta",
    },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    onScroll();

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        onScroll
      );
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";

      return;
    }

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
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
  }, [menuOpen]);

  if (pathname.startsWith("/hola")) {
    return null;
  }

  return (
    <>
      <header
        className={`future-nav ${
          scrolled
            ? "future-nav-solid"
            : ""
        }`}
      >
        <div className="future-nav-inner">
          <Link
            href="/"
            className="future-logo"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            SPORTCRZ
          </Link>

          <nav
            className="future-links"
            aria-label="Navegación principal"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`future-link ${
                  pathname === link.href
                    ? "active"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className={`future-menu-button ${
              menuOpen ? "open" : ""
            }`}
            onClick={() =>
              setMenuOpen(
                (current) =>
                  !current
              )
            }
            aria-label={
              menuOpen
                ? "Cerrar menú"
                : "Abrir menú"
            }
            aria-expanded={
              menuOpen
            }
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={`future-mobile-menu ${
          menuOpen ? "open" : ""
        }`}
        aria-hidden={!menuOpen}
      >
        <nav
          className="future-mobile-links"
          aria-label="Navegación móvil"
        >
          {links.map(
            (link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`future-mobile-link ${
                  pathname ===
                  link.href
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                <span>
                  {link.label}
                </span>

                <span>
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>
              </Link>
            )
          )}
        </nav>

        <div className="future-mobile-footer">
          <span>
            SPORTCRZ / 2026
          </span>

          <span>
            PANAMÁ
          </span>
        </div>
      </div>
    </>
  );
}
