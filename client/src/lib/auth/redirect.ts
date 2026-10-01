import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";

// Placeholder origin, only used to detect values that resolve to another site.
const BASE = "http://internal.invalid";

/**
 * `next` comes from the URL, so it can point anywhere. Only same-site paths are kept;
 * anything else falls back to the dashboard.
 */
export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  let url: URL;
  try {
    // The URL parser normalizes the tricks browsers accept: "//host", "/\host", tabs, newlines.
    url = new URL(value, BASE);
  } catch {
    return DEFAULT_SIGNED_IN_PATH;
  }

  if (url.origin !== BASE) {
    return DEFAULT_SIGNED_IN_PATH;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
