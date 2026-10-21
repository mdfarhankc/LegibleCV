import "server-only";

import { env } from "@/lib/env";

// Where Supabase sends the browser back to: after a Google or GitHub sign-in, and after a link
// in one of its emails is opened. The callback route signs the user in and moves on to `next`.
// Built from SITE_URL rather than request headers, which a client can set.
export async function callbackUrl(next: string): Promise<string> {
  const callback = new URL("/auth/callback", env.siteUrl);
  callback.searchParams.set("next", next);
  return callback.toString();
}
