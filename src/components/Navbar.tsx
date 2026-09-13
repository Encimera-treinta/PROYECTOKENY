"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

export default function Navbar() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] =
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
    {
      href: "/carrito",
      label: "Carrito",
    },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className="future-nav">
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
