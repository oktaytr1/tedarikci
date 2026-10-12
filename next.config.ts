import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  logging: { serverFunctions: false },
  partialPrefetching: true,
};

export default nextConfig;
