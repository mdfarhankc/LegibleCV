import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PasswordForm } from "@/components/auth/password-form";
import { updatePassword } from "@/lib/auth/account-actions";
import { requireUser } from "@/lib/auth/dal";

import { ChangeEmailForm } from "./change-email-form";
import { DeleteAccountForm } from "./delete-account-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Settings" };

type SectionProps = {
  title: string;
  description: ReactNode;
  children: ReactNode;
};

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="grid gap-6 border-t py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:gap-12">
      <div className="space-y-1">
        <h2 className="font-medium">{title}</h2>
        <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="pb-8 font-heading text-2xl font-semibold">Settings</h1>

      <Section
        title="Profile"
        description="Your name and contact details. New resumes start with these filled in, and you can still change them on each resume."
      >
        <ProfileForm profile={user.profile} />
      </Section>

      <Section
        title="Email"
        description={
          <>
            You sign in as <span className="text-foreground">{user.email}</span>. To change it,
            we send a confirmation link to the new address first.
          </>
        }
      >
        <ChangeEmailForm />
      </Section>

      <Section
        title="Password"
        description="At least 8 characters. If you signed up with Google or GitHub, this adds a password so you can also log in with your email."
      >
        <PasswordForm action={updatePassword} submitLabel="Change password" />
      </Section>

      <Section
        title="Delete account"
        description="Permanently deletes your account and every resume in it. This can't be undone."
      >
        <DeleteAccountForm email={user.email} />
      </Section>
    </div>
  );
}
