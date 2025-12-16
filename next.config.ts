import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Exclude CLI folder from compilation
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/src/cli/**'],
    };
    return config;
  },
};

export default nextConfig;
