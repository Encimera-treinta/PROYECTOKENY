"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import UserChip from "./UserChip";
import CartButton from "./CartButton";

/* Controles flotantes globales.
   En el área de administración no se muestra el
   carrito ni el chip de cliente; el toggle de tema
   (modo oscuro) sí se mantiene. */
export default function FloatingControls() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdmin && <CartButton />}
      {!isAdmin && <UserChip />}
      <ThemeToggle className="theme-toggle-float" />
    </>
  );
}