import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import "@/styles/carrito.css";

import Navbar from "@/components/Navbar";
import { CartProvider } from "@/components/CartProvider";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SportCrz",
  description: "Tienda SportCrz",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#090909",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${archivo.variable} ${inter.variable}`}>
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
