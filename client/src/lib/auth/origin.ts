import "server-only";

import { headers } from "next/headers";

async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) {
    return origin;
  }
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

// Where Supabase sends the browser back to: after a Google or GitHub sign-in, and after a link
// in one of its emails is opened. The callback route signs the user in and moves on to `next`.
export async function callbackUrl(next: string): Promise<string> {
  const callback = new URL("/auth/callback", await requestOrigin());
  callback.searchParams.set("next", next);
  return callback.toString();
}
