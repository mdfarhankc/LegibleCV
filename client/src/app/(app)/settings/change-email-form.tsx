"use client";

import { useActionState, useState } from "react";

import { FormField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { updateEmail } from "@/lib/auth/account-actions";

export function ChangeEmailForm() {
  const [state, action, pending] = useActionState(updateEmail, undefined);
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="grid gap-4">
      <FormField
        name="email"
        label="New email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        errors={state?.fieldErrors?.email}
      />
      <FormMessage state={state} />
      <Button type="submit" className="justify-self-start" disabled={pending}>
        {pending ? "Sending link..." : "Change email"}
      </Button>
    </form>
  );
}
