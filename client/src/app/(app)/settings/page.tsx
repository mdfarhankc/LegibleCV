import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PasswordForm } from "@/components/auth/password-form";
import { updatePassword } from "@/lib/auth/account-actions";
import { requireUser } from "@/lib/auth/dal";
import { OAUTH_PROVIDER_LABELS, OAUTH_PROVIDERS } from "@/lib/auth/schemas";
import { SITE } from "@/lib/site";
import { createClient, type Supabase } from "@/lib/supabase/server";

import { ChangeEmailForm } from "./change-email-form";
import { type ConnectedAccount, ConnectedAccountsForm } from "./connected-accounts-form";
import { DeleteAccountButton } from "./delete-account-button";
import { OtherDevicesForm } from "./other-devices-form";
import { type PasskeyRow, PasskeysForm } from "./passkeys-form";
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

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

// Null when the list couldn't be read.
async function listConnectedAccounts(supabase: Supabase): Promise<ConnectedAccount[] | null> {
  const { data, error } = await supabase.auth.getUserIdentities();
  if (error || !data) {
    return null;
  }
  return OAUTH_PROVIDERS.map((provider) => {
    const identity = data.identities.find((item) => item.provider === provider);
    const details = identity?.identity_data;
    const name = [details?.email, details?.user_name, details?.name].find(
      (value) => typeof value === "string" && value,
    );
    return {
      provider,
      label: OAUTH_PROVIDER_LABELS[provider],
      account: identity ? (name ?? "Connected") : null,
    };
  });
}

// Null when passkeys are turned off in Supabase, or the list couldn't be read.
async function listPasskeys(supabase: Supabase): Promise<PasskeyRow[] | null> {
  const { data, error } = await supabase.auth.passkey.list();
  if (error || !data) {
    return null;
  }
  return data.map((passkey) => ({
    id: passkey.id,
    name: passkey.friendly_name || "Passkey",
    added: dateFormat.format(new Date(passkey.created_at)),
    lastUsed: passkey.last_used_at ? dateFormat.format(new Date(passkey.last_used_at)) : null,
  }));
}

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const user = await requireUser();
  // Set by the callback and confirm routes.
  const { error, notice } = await searchParams;
  const failed = error === "callback_failed";
  const emailConfirmed = notice === "email_change";
  const supabase = await createClient();
  const [accounts, passkeys] = await Promise.all([
    listConnectedAccounts(supabase),
    listPasskeys(supabase),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="pb-8 font-heading text-2xl font-semibold">Settings</h1>
      {failed && (
        <p role="alert" className="pb-8 text-sm text-destructive">
          That didn&apos;t complete. The link may have expired, or that account is already connected
          to a different {SITE.name} account.
        </p>
      )}
      {emailConfirmed && (
        <p role="status" className="pb-8 text-sm text-muted-foreground">
          Confirmed. If a link was also sent to your other address, open that one too. Your email
          below changes once both are confirmed.
        </p>
      )}

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
        description="If you signed up with Google or GitHub, this adds a password so you can also log in with your email."
      >
        <PasswordForm action={updatePassword} submitLabel="Change password" />
      </Section>

      {accounts && (
        <Section
          title="Connected accounts"
          description="Log in with Google or GitHub as well. Disconnecting one doesn't delete anything; it only stops that account from opening this one."
        >
          <ConnectedAccountsForm accounts={accounts} />
        </Section>
      )}

      {passkeys && (
        <Section
          title="Passkeys"
          description="Log in with your fingerprint, face, or device PIN instead of a password. A passkey works on the device it was created on, and on others that share the same passkey manager."
        >
          <PasskeysForm passkeys={passkeys} />
        </Section>
      )}

      <Section
        title="Other devices"
        description="Logs this account out everywhere except here. Use it after logging in on a shared computer, or if you think someone else has access. It can take up to an hour to reach a device that is already open."
      >
        <OtherDevicesForm />
      </Section>

      <section className="mt-4 grid gap-4 rounded-xl border border-destructive/40 p-5 sm:p-6">
        <h2 className="font-medium text-destructive">Danger zone</h2>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-12">
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Delete account</h3>
            <p className="max-w-prose text-sm text-muted-foreground">
              Permanently deletes your account and every resume in it. This can&apos;t be undone.
            </p>
          </div>
          <DeleteAccountButton email={user.email} />
        </div>
      </section>
    </div>
  );
}
