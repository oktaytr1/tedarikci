import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Geliştirmede server action argümanları terminale yazılıyordu: parola belirleme/sıfırlama
  // çağrılarında parola düz metin görünürdü. Kapalı (üretimde zaten yazılmıyor).
  logging: { serverFunctions: false },
  partialPrefetching: true,
  // Kapalı katalog: hiçbir yanıt dizine eklenmesin. Dış kaynaklı ürün fotoğrafları yüklenirken
  // fotoğrafın barındığı site sayfa adreslerimizi Referer başlığından öğrenmesin.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
