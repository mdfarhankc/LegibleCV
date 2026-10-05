"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { changeProviderConnection } from "@/lib/auth/account-actions";
import type { OAuthProvider } from "@/lib/auth/schemas";

export type ConnectedAccount = {
  provider: OAuthProvider;
  label: string;
  // The address or name on the connected account. Null when it isn't connected.
  account: string | null;
};

// Reads its own form's status, so only the button that was pressed says it's working.
function ConnectionButton({ connected, disabled }: { connected: boolean; disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      name="intent"
      value={connected ? "disconnect" : "connect"}
      variant={connected ? "ghost" : "outline"}
      size="sm"
      disabled={disabled}
    >
      {pending ? "Working..." : connected ? "Disconnect" : "Connect"}
    </Button>
  );
}

export function ConnectedAccountsForm({ accounts }: { accounts: ConnectedAccount[] }) {
  const [state, action, pending] = useActionState(changeProviderConnection, undefined);

  return (
    <div className="grid content-start gap-4">
      <ul className="grid gap-2">
        {accounts.map(({ provider, label, account }) => (
          <li key={provider} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{label}</p>
              <p className="truncate text-sm text-muted-foreground">{account ?? "Not connected"}</p>
            </div>
            <form action={action}>
              <input type="hidden" name="provider" value={provider} />
              <ConnectionButton connected={Boolean(account)} disabled={pending} />
            </form>
          </li>
        ))}
      </ul>
      <FormMessage state={state} />
    </div>
  );
}
