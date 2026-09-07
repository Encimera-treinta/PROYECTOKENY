import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "node:path";

// Conserva la configuración del proyecto migrado, ubicada un nivel arriba.
loadEnvConfig(path.resolve(process.cwd(), ".."));

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
};
export default nextConfig;
