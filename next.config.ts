import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/jkc-devotion-app',
  assetPrefix: '/jkc-devotion-app/',
  trailingSlash: true,
  // Ensure we don't have hydration issues in static export
  reactStrictMode: true,
};

export default nextConfig;

