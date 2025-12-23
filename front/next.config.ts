import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // ❌ Removed for dynamic mode
  // trailingSlash: true, // ❌ Removed for dynamic mode
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;