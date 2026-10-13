import type { MetadataRoute } from "next";
import { SITE_ADRESI } from "@/lib/iletisim";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${SITE_ADRESI}/sitemap.xml`,
  };
}
