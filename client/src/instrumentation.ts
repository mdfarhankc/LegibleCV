// Importing env validates it, so a deploy with a missing var fails on start, not on first use.
export async function register() {
  await import("@/lib/env");
}
