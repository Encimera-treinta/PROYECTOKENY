import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Necesario porque el repo vive dentro de un subdirectorio
     del monorepo de escritorio; en Vercel no afecta. */
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["sharp"],
  experimental: {
    /* Transiciones de vista nativas entre rutas —
       navegación sin pantallas de carga. */
    viewTransition: true,
  },
};

export default nextConfig;
