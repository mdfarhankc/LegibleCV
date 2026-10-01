import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { PasswordForm } from "@/components/auth/password-form";
import { setNewPassword } from "@/lib/auth/account-actions";
import { requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Choose a new password" };

// Reached from the reset link, which signs the user in first.
export default async function UpdatePasswordPage() {
  await requireUser();

  return (
    <AuthCard title="Choose a new password" description="You'll use it the next time you log in.">
      <PasswordForm action={setNewPassword} submitLabel="Save password" />
    </AuthCard>
  );
}
