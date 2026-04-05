import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.18"],
  turbopack: {
    root: projectRoot,
  },
  watchOptions:
    process.env.NEXT_DISABLE_POLL === "1"
      ? undefined
      : { pollIntervalMs: 500 },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 500,
        aggregateTimeout: 200,
      };
    }
    return config;
  },
};

export default nextConfig;