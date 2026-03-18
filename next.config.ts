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
  trailingSlash: true,
  // NOTE: Turbopack removed — it causes "Lock broken by another request
  // with the 'steal' option" AbortError in Next.js 16 on some setups.
  // Run with: next dev --turbopack to opt back in manually when stable.
};

export default withPWA(nextConfig);

