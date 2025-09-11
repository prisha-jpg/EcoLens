import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 🚨 Temporarily ignore ESLint errors in build
  },
};

export default nextConfig;
