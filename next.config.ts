import type { NextConfig } from "next";

// Declare next-pwa configuration
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Disable PWA in development for faster builds
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/jkc-devotion-app',
  assetPrefix: '/jkc-devotion-app/',
  // Provide empty turbopack config to avoid Turbopack errors
  turbopack: {},
};

export default withPWA(nextConfig);
