import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Exclude test files and problematic modules from build
  webpack: (config, { isServer }) => {
    // Ignore test files in node_modules
    config.module.rules.push({
      test: /node_modules\/.*\.(test|spec)\.(js|ts|tsx)$/,
      loader: "ignore-loader",
    });

    // Fix for pino in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        pino: false,
      };
    }

    return config;
  },
};

export default nextConfig;
