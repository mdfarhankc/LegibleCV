"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form-state";

type PasswordState = FormState<"password">;

type PasswordFormProps = {
  action: (state: PasswordState, formData: FormData) => Promise<PasswordState>;
  submitLabel: string;
};

export function PasswordForm({ action, submitLabel }: PasswordFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <PasswordField
        name="password"
        label="New password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters."
        errors={state?.fieldErrors?.password}
      />
      <FormMessage state={state} />
      <Button type="submit" className="justify-self-start" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
