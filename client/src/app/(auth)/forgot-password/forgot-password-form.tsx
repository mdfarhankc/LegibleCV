"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/auth/actions";
import { LOGIN_PATH } from "@/lib/auth/routes";

const backToLogin = (
  <Link href={LOGIN_PATH} className="text-foreground underline underline-offset-4">
    Back to log in
  </Link>
);

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  const [email, setEmail] = useState("");

  if (state?.success) {
    return (
      <AuthCard
        title="Check your email"
        description={`If an account exists for ${email}, a link to reset the password is on its way.`}
        footer={backToLogin}
      />
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new one."
      footer={backToLogin}
    >
      <form action={action} className="grid gap-4">
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          errors={state?.fieldErrors?.email}
        />
        <FormMessage state={state} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending link..." : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
