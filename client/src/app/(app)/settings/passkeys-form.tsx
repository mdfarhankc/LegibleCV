"use client";

import { KeyRound, Plus } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  finishPasskeyRegistration,
  removePasskey,
  startPasskeyRegistration,
} from "@/lib/auth/passkey-actions";
import {
  createPasskey,
  deviceName,
  passkeyErrorMessage,
  passkeysSupported,
  UNSUPPORTED_MESSAGE,
} from "@/lib/auth/passkey-browser";

export type PasskeyRow = {
  id: string;
  name: string;
  // Formatted on the server, so server and client render the same text.
  added: string;
  lastUsed: string | null;
};

const FAILED = "The passkey couldn't be added. Try again.";

export function PasskeysForm({ passkeys }: { passkeys: PasskeyRow[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function add() {
    if (!passkeysSupported()) {
      setMessage(UNSUPPORTED_MESSAGE);
      return;
    }
    startTransition(async () => {
      setMessage(null);
      try {
        const challenge = await startPasskeyRegistration();
        if (!challenge.ok) {
          setMessage(challenge.message);
          return;
        }
        const credential = await createPasskey(challenge.options);
        const result = await finishPasskeyRegistration(
          challenge.challengeId,
          credential,
          deviceName(),
        );
        if (!result.ok) {
          setMessage(result.message);
        }
      } catch (error) {
        setMessage(passkeyErrorMessage(error, FAILED));
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      setMessage(null);
      const result = await removePasskey(id).catch(() => ({
        ok: false as const,
        message: "Could not remove the passkey. Check your connection.",
      }));
      if (!result.ok) {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="grid content-start gap-4">
      {passkeys.length > 0 && (
        <ul className="grid gap-2">
          {passkeys.map((passkey) => (
            <li key={passkey.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <KeyRound className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{passkey.name}</p>
                <p className="text-sm text-muted-foreground">
                  Added {passkey.added}
                  {passkey.lastUsed && `, last used ${passkey.lastUsed}`}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => remove(passkey.id)}
                aria-label={`Remove passkey ${passkey.name}`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        disabled={pending}
        onClick={add}
      >
        <Plus />
        {pending ? "Working..." : "Add a passkey"}
      </Button>
      {message && (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
