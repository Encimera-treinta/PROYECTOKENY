import type { Metadata } from "next";

import "./globals.css";
import "@/styles/carrito.css";

import Navbar from "@/components/Navbar";
import { CartProvider } from "@/components/CartProvider";

export const metadata: Metadata = {
  title: "SportCrz",
  description: "Tienda SportCrz",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <Navbar />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}