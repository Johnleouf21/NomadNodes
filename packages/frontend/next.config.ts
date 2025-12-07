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
  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Alias problematic optional dependencies to empty module
      "pino-pretty": "./lib/noop.js",
      "@react-native-async-storage/async-storage": "./lib/noop.js",
    },
  },
};

export default nextConfig;
