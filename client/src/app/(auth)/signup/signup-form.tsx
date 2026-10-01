"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { signup } from "@/lib/auth/actions";
import { LOGIN_PATH } from "@/lib/auth/routes";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  // Controlled, so the email survives the form reset React does after an action.
  const [email, setEmail] = useState("");

  if (state?.success) {
    return (
      <AuthCard
        title="Check your email"
        description={`If ${email} can be used to sign up, a confirmation link is on its way. Open it to finish creating your account.`}
      />
    );
  }

  return (
    <AuthCard
      title="Create your account"
      description="Start building your resume."
      oauth={{}}
      footer={
        <p>
          Already have an account?{" "}
          <Link href={LOGIN_PATH} className="text-foreground underline underline-offset-4">
            Log in
          </Link>
        </p>
      }
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
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          errors={state?.fieldErrors?.password}
        />
        <FormMessage state={state} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account..." : "Sign up"}
        </Button>
      </form>
    </AuthCard>
  );
}
