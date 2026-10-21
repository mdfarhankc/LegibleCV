import type { MetadataRoute } from "next";

import { LOGIN_PATH, SIGNUP_PATH } from "@/lib/auth/routes";
import { env } from "@/lib/env";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", LOGIN_PATH, SIGNUP_PATH, PRIVACY_PATH, TERMS_PATH].map((path) => ({
    url: new URL(path, env.siteUrl).toString(),
  }));
}
