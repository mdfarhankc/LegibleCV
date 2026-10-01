import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

// Only known codes are shown, so the URL can't inject arbitrary text into the page.
const NOTICES: Record<string, string> = {
  link_invalid: "That link is invalid or has expired. Request a new one.",
  oauth_failed: "Sign-in with that provider didn't complete. Try again.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const error = first(params.error);

  return <LoginForm next={first(params.next)} notice={error ? NOTICES[error] : undefined} />;
}
