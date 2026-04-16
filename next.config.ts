import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  generateBuildId: async () => 'church-os-build',
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
