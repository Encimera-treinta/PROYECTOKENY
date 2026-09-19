import type { Metadata } from "next";
import { Barlow_Condensed, Barlow } from "next/font/google";
import "./globals.css";
import "@/styles/carrito.css";
import "@/styles/liquid-glass.css";
import "@/styles/ios-theme.css";

import Navbar from "@/components/Navbar";
import { CartProvider } from "@/components/CartProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import FloatingControls from "@/components/FloatingControls";

const barlowCond = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const barlow = Barlow({
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
    <html lang="es" className={`${barlowCond.variable} ${barlow.variable}`}>
      <body>
        <ThemeProvider>
          <CartProvider>
            <Navbar />
            {children}
            <FloatingControls />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
