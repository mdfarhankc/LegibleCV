"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { callbackUrl } from "@/lib/auth/origin";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { DEFAULT_SIGNED_IN_PATH, LOGIN_PATH, UPDATE_PASSWORD_PATH } from "@/lib/auth/routes";
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

type SignupState = FormState<"full_name" | "email" | "password">;

export async function signup(_state: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    ...readCredentials(formData),
    full_name: String(formData.get("full_name") ?? ""),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { full_name, ...credentials } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      // The profile lives in user metadata. New resumes start with this name filled in.
      data: { full_name },
      emailRedirectTo: await callbackUrl(DEFAULT_SIGNED_IN_PATH),
    },
  });
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
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: await callbackUrl(UPDATE_PASSWORD_PATH),
  });
  if (error?.code === "over_email_send_rate_limit") {
    return { message: "Too many requests. Try again in a few minutes." };
  }
  // Same answer whether or not the account exists.
  return { success: "sent" };
}

export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = oauthProviderSchema.safeParse(formData.get("provider"));
  if (!provider.success) {
    redirect(`${LOGIN_PATH}?error=oauth_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider.data,
    options: { redirectTo: await callbackUrl(safeRedirectPath(formData.get("next"))) },
  });
  if (error || !data.url) {
    redirect(`${LOGIN_PATH}?error=oauth_failed`);
  }

  redirect(data.url);
}
