"use client";

import { useActionState, useState } from "react";

import { FormField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/lib/auth/account-actions";

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  const [confirmation, setConfirmation] = useState("");
  const confirmed = confirmation.trim().toLowerCase() === email.toLowerCase();

  return (
    <form action={action} className="grid gap-4">
      <FormField
        name="confirmation"
        label={`Type ${email} to confirm`}
        type="email"
        autoComplete="off"
        required
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        errors={state?.fieldErrors?.confirmation}
      />
      <FormMessage state={state} />
      <Button
        type="submit"
        variant="destructive"
        className="justify-self-start"
        disabled={pending || !confirmed}
      >
        {pending ? "Deleting account..." : "Delete account"}
      </Button>
    </form>
  );
}
