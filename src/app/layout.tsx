import type { Metadata } from "next";

import "./globals.css";
import "@/styles/carrito.css";

import Navbar from "@/components/Navbar";
import { CartProvider } from "@/components/CartProvider";

export const metadata: Metadata = {
  title: "SportCrz",
  description: "Tienda SportCrz",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090909",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          rel="preload"
          as="video"
          href="/img/Video_Fondo.mp4"
          type="video/mp4"
          fetchPriority="high"
        />
      </head>
      <body>
        <CartProvider>
          <Navbar />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}