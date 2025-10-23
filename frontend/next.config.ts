import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Optimize performance
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
  
  // Improve navigation performance
  // swcMinify is removed in Next.js 15; it's always on
};

export default nextConfig;
