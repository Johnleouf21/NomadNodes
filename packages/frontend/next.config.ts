import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reduce file watching overhead
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 2,
  },
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
  transpilePackages: ["@nomad-nodes/indexer"],
  // Webpack configuration (for production builds)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "pino-pretty": false,
        "@react-native-async-storage/async-storage": false,
        tap: false,
      };
    }
    return config;
  },
  // Turbopack configuration (for dev mode)
  turbopack: {
    resolveAlias: {
      // Alias problematic optional dependencies to empty module
      "pino-pretty": "./lib/noop.js",
      "@react-native-async-storage/async-storage": "./lib/noop.js",
      tap: "./lib/noop.js",
    },
  },
};

export default nextConfig;
