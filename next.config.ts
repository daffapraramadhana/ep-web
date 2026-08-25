import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output lets the Docker runtime stage ship only the
  // minimal server bundle + traced node_modules instead of the full
  // dependency tree.
  output: 'standalone',
};

export default nextConfig;
