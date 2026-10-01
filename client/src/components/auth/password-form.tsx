"use client";

import { useActionState } from "react";

import { FormField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form-state";

type PasswordState = FormState<"password" | "confirm">;

type PasswordFormProps = {
  action: (state: PasswordState, formData: FormData) => Promise<PasswordState>;
  submitLabel: string;
};

export function PasswordForm({ action, submitLabel }: PasswordFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <FormField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        errors={state?.fieldErrors?.password}
      />
      <FormField
        name="confirm"
        label="Repeat new password"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.fieldErrors?.confirm}
      />
      <FormMessage state={state} />
      <Button type="submit" className="justify-self-start" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
