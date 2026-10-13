import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  logging: { serverFunctions: false },
  partialPrefetching: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  // Ürün kataloğu şimdilik yayında değil; geri açmak için bu yönlendirmeyi kaldırın.
  async redirects() {
    return [{ source: "/katalog/:yol*", destination: "/", permanent: false }];
  },
};

export default nextConfig;
