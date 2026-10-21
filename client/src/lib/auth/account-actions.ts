"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireFreshUser } from "@/lib/auth/dal";
import { callbackUrl } from "@/lib/auth/origin";
import { profileSchema } from "@/lib/auth/profile";
import { DEFAULT_SIGNED_IN_PATH, SETTINGS_PATH } from "@/lib/auth/routes";
import {
  emailSchema,
  newPasswordSchema,
  OAUTH_PROVIDER_LABELS,
  oauthProviderSchema,
} from "@/lib/auth/schemas";
import type { FormState } from "@/lib/form-state";
import { removeAllPhotos } from "@/lib/resumes/photo";
import { createClient } from "@/lib/supabase/server";

type PasswordState = FormState<"password">;

async function changePassword(formData: FormData): Promise<PasswordState> {
  await requireFreshUser();

  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (!error) {
    return undefined;
  }

  switch (error.code) {
    case "same_password":
      return { message: "Choose a password you haven't used on this account." };
    case "weak_password":
      return { message: "That password is too weak. Try a longer one." };
    case "reauthentication_needed":
      return { message: "For security, log out and log in again, then change your password." };
    default:
      return { message: "Could not update your password. Try again." };
  }
}

// Settings page: stay on the page and confirm.
export async function updatePassword(
  _state: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  return (await changePassword(formData)) ?? { success: "Password updated." };
}

// After a reset link: continue into the app.
export async function setNewPassword(
  _state: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const failure = await changePassword(formData);
  if (failure) {
    return failure;
  }
  redirect(DEFAULT_SIGNED_IN_PATH);
}

export async function updateEmail(
  _state: FormState<"email">,
  formData: FormData,
): Promise<FormState<"email">> {
  const user = await requireFreshUser();

  const parsed = emailSchema.safeParse({ email: String(formData.get("email") ?? "").trim() });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  if (parsed.data.email.toLowerCase() === user.email.toLowerCase()) {
    return { fieldErrors: { email: ["That's already your email address."] } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: await callbackUrl(SETTINGS_PATH) },
  );
  if (error) {
    const message =
      error.code === "over_email_send_rate_limit"
        ? "Too many requests. Try again in a few minutes."
        : "That email address can't be used. Try a different one.";
    return { message };
  }
  return { success: `Confirmation link sent to ${parsed.data.email}. Your email changes once you open it.` };
}

export async function deleteAccount(
  _state: FormState<"confirmation">,
  formData: FormData,
): Promise<FormState<"confirmation">> {
  const user = await requireFreshUser();

  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation.toLowerCase() !== user.email.toLowerCase()) {
    return { fieldErrors: { confirmation: ["Type your email address exactly to confirm."] } };
  }

  const supabase = await createClient();
  // The account can't be deleted while it still owns stored files.
  if (!(await removeAllPhotos(supabase, user.id))) {
    return { message: "Could not delete your account. Try again." };
  }
  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    // The photos are gone by now. Resumes still render without them.
    return {
      message: "Your photos were removed, but your account could not be deleted. Try again.",
    };
  }

  // The user no longer exists; this only clears the session cookies.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}

type ProfileState = FormState<"full_name" | "phone" | "location">;

export async function updateProfile(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  await requireFreshUser();

  const parsed = profileSchema.safeParse({
    full_name: String(formData.get("full_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    location: String(formData.get("location") ?? ""),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: parsed.data });
  if (error) {
    return { message: "Could not save your profile. Try again." };
  }

  // The name in the header comes from the JWT, which still has the old metadata.
  await supabase.auth.refreshSession();
  revalidatePath("/", "layout");
  return { success: "Profile saved." };
}

// Connects or disconnects a Google or GitHub account. The button pressed says which.
export async function changeProviderConnection(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireFreshUser();

  const provider = oauthProviderSchema.safeParse(formData.get("provider"));
  const intent = formData.get("intent");
  if (!provider.success || (intent !== "connect" && intent !== "disconnect")) {
    return { message: "That didn't work. Try again." };
  }
  const label = OAUTH_PROVIDER_LABELS[provider.data];
  const supabase = await createClient();

  if (intent === "connect") {
    const { data, error } = await supabase.auth.linkIdentity({
      provider: provider.data,
      options: { redirectTo: await callbackUrl(SETTINGS_PATH) },
    });
    if (error || !data.url) {
      return {
        message:
          error?.code === "manual_linking_disabled"
            ? "Connecting accounts is turned off for this app."
            : `Could not start connecting ${label}. Try again.`,
      };
    }
    redirect(data.url);
  }

  // Looked up here instead of trusting an id from the page.
  const { data, error: listError } = await supabase.auth.getUserIdentities();
  const identity = data?.identities.find((item) => item.provider === provider.data);
  if (listError || !identity) {
    return { message: `${label} isn't connected to this account.` };
  }
  const { error } = await supabase.auth.unlinkIdentity(identity);
  if (error) {
    return {
      message:
        error.code === "single_identity_not_deletable"
          ? `${label} is your only way to log in. Connect another account first.`
          : `Could not disconnect ${label}. Try again.`,
    };
  }

  revalidatePath(SETTINGS_PATH);
  return { success: `${label} disconnected.` };
}

export async function signOutOtherDevices(): Promise<FormState> {
  await requireFreshUser();

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    return { message: "Could not log out the other devices. Try again." };
  }
  return { success: "Done. Other devices are logged out within the hour." };
}
