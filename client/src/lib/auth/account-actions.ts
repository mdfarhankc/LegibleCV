"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireFreshUser } from "@/lib/auth/dal";
import { profileSchema } from "@/lib/auth/profile";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";
import { emailSchema, newPasswordSchema } from "@/lib/auth/schemas";
import type { FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

type PasswordState = FormState<"password" | "confirm">;

async function changePassword(formData: FormData): Promise<PasswordState> {
  await requireFreshUser();

  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
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
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
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
  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    return { message: "Could not delete your account. Try again." };
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
