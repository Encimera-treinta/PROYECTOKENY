import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Necesario porque el repo vive dentro de un subdirectorio
     del monorepo de escritorio; en Vercel no afecta. */
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
