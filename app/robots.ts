import type { MetadataRoute } from "next";

// Kapalı katalog: site arama motorlarına tümüyle kapalı.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
