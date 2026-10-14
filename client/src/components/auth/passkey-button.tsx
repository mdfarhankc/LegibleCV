"use client";

import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";

import { useOtherSignInBusy } from "@/components/auth/sign-in-busy";
import { Button } from "@/components/ui/button";
import { finishPasskeySignIn, startPasskeySignIn } from "@/lib/auth/passkey-actions";
import {
  getPasskey,
  passkeyErrorMessage,
  passkeysSupported,
  UNSUPPORTED_MESSAGE,
} from "@/lib/auth/passkey-browser";

const FAILED = "Passkey sign-in didn't complete. Try again or use another way to log in.";

export function PasskeyButton({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const otherBusy = useOtherSignInBusy("passkey", pending);

  function signIn() {
    if (!passkeysSupported()) {
      setMessage(UNSUPPORTED_MESSAGE);
      return;
    }
    startTransition(async () => {
      setMessage(null);
      try {
        const challenge = await startPasskeySignIn();
        if (!challenge.ok) {
          setMessage(challenge.message);
          return;
        }
        const credential = await getPasskey(challenge.options);
        // On success this redirects and nothing comes back, so anything returned is a failure.
        const failure = await finishPasskeySignIn(challenge.challengeId, credential, next);
        if (failure) {
          setMessage(failure.message);
        }
      } catch (error) {
        setMessage(passkeyErrorMessage(error, FAILED));
      }
    });
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" className="w-full" disabled={pending || otherBusy} onClick={signIn}>
        <KeyRound />
        {pending ? "Waiting for your passkey..." : "Sign in with a passkey"}
      </Button>
      {message && (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
