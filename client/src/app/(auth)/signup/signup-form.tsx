"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/form-field";
import { SignInSubmit } from "@/components/auth/sign-in-busy";
import { FormMessage } from "@/components/form-message";
import { PasswordField } from "@/components/password-field";
import { signup } from "@/lib/auth/actions";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/site";

export function SignupForm() {
  const [state, action] = useActionState(signup, undefined);
  // Controlled, so they survive the form reset React does after an action.
  const [fullName, setFullName] = useState("");
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
          name="full_name"
          label="Full name"
          autoComplete="name"
          required
          maxLength={200}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          errors={state?.fieldErrors?.full_name}
        />
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
        <PasswordField
          name="password"
          label="Password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
          errors={state?.fieldErrors?.password}
        />
        <FormMessage state={state} />
        <SignInSubmit label="Sign up" pendingLabel="Creating account..." />
        <p className="text-center text-sm text-muted-foreground">
          By creating an account you agree to the{" "}
          <Link href={TERMS_PATH} className="text-foreground underline underline-offset-4">
            terms
          </Link>{" "}
          and the{" "}
          <Link href={PRIVACY_PATH} className="text-foreground underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthCard>
  );
}
