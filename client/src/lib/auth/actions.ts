"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { safeRedirectPath } from "@/lib/auth/redirect";
import { DEFAULT_SIGNED_IN_PATH, LOGIN_PATH } from "@/lib/auth/routes";
import {
  emailSchema,
  loginSchema,
  oauthProviderSchema,
  signupSchema,
} from "@/lib/auth/schemas";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

type CredentialsState = FormState<"email" | "password">;

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function login(_state: CredentialsState, formData: FormData): Promise<CredentialsState> {
  const parsed = loginSchema.safeParse(readCredentials(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Confirm your email first. Check your inbox for the link."
        : // Same message for a wrong email and a wrong password, so accounts can't be probed.
          "Invalid email or password.";
    return { message };
  }

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signup(_state: CredentialsState, formData: FormData): Promise<CredentialsState> {
  const parsed = signupSchema.safeParse(readCredentials(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    const message =
      error.code === "over_email_send_rate_limit"
        ? "Too many sign-up attempts. Try again in a few minutes."
        : error.code === "weak_password"
          ? "That password is too weak. Try a longer one."
          : "Could not create your account. Try again.";
    return { message };
  }

  // Only happens when email confirmation is turned off in Supabase.
  if (data.session) {
    redirect(DEFAULT_SIGNED_IN_PATH);
  }
  return { success: "sent" };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _state: FormState<"email">,
  formData: FormData,
): Promise<FormState<"email">> {
  const parsed = emailSchema.safeParse({ email: String(formData.get("email") ?? "").trim() });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  if (error?.code === "over_email_send_rate_limit") {
    return { message: "Too many requests. Try again in a few minutes." };
  }
  // Same answer whether or not the account exists.
  return { success: "sent" };
}

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

export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = oauthProviderSchema.safeParse(formData.get("provider"));
  if (!provider.success) {
    redirect(`${LOGIN_PATH}?error=oauth_failed`);
  }

  const callback = new URL("/auth/callback", await requestOrigin());
  callback.searchParams.set("next", safeRedirectPath(formData.get("next")));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider.data,
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) {
    redirect(`${LOGIN_PATH}?error=oauth_failed`);
  }

  redirect(data.url);
}
