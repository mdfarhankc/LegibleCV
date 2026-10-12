import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { type Profile, readProfile } from "@/lib/auth/profile";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string;
  // Name, phone, and location the user saved in Settings. Used to prefill new resumes.
  profile: Profile;
};

// I use getClaims() for auth decisions: it verifies the JWT against the project's JWKS.
// getSession() only reads the cookie, so I never trust it for that.
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) {
    return null;
  }
  return {
    id: claims.sub,
    email: claims.email ?? "",
    profile: readProfile(claims.user_metadata),
  };
});

export async function requireUser(): Promise<AuthUser> {
  const user = await getUser();
  if (!user) {
    redirect(LOGIN_PATH);
  }
  return user;
}

// Asks the Auth server, so a revoked session is rejected even while its JWT is still valid.
// For account changes (password, email, delete). Costs a network call, so not for every page.
export async function requireFreshUser(): Promise<AuthUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect(LOGIN_PATH);
  }
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    profile: readProfile(data.user.user_metadata),
  };
}
