import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/jkc-devotion-app',
  assetPrefix: '/jkc-devotion-app/',
};

export default nextConfig;
