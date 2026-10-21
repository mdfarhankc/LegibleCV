import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/editor", "/settings", "/auth"] },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
