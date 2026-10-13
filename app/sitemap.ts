import type { MetadataRoute } from "next";
import { SITE_ADRESI } from "@/lib/iletisim";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_ADRESI, changeFrequency: "monthly", priority: 1 }];
}
