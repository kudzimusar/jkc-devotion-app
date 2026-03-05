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
  // output: 'export', // Removed to support Middleware and API routes
  images: {
    unoptimized: true,
  },
  basePath: '/jkc-devotion-app',
  assetPrefix: '/jkc-devotion-app/',
  trailingSlash: true,
  // Provide empty turbopack config to avoid Turbopack errors
  turbopack: {},
};

export default withPWA(nextConfig);
