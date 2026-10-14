"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/form-field";
import { SignInSubmit } from "@/components/auth/sign-in-busy";
import { FormMessage } from "@/components/form-message";
import { PasswordField } from "@/components/password-field";
import { login } from "@/lib/auth/actions";
import { FORGOT_PASSWORD_PATH, SIGNUP_PATH } from "@/lib/auth/routes";

type LoginFormProps = {
  next?: string;
  notice?: string;
};

const linkClass = "text-foreground underline underline-offset-4";

export function LoginForm({ next, notice }: LoginFormProps) {
  const [state, action] = useActionState(login, undefined);
  // Controlled, so the email survives the form reset React does after an action.
  const [email, setEmail] = useState("");

  return (
    <AuthCard
      title="Log in"
      description="Welcome back."
      oauth={{ next, passkey: true }}
      footer={
        <p>
          No account yet?{" "}
          <Link href={SIGNUP_PATH} className={linkClass}>
            Sign up
          </Link>
        </p>
      }
    >
      <form action={action} className="grid gap-4">
        {next && <input type="hidden" name="next" value={next} />}
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
          autoComplete="current-password"
          required
          errors={state?.fieldErrors?.password}
        />
        <Link href={FORGOT_PASSWORD_PATH} className={`${linkClass} -mt-1 justify-self-end text-sm`}>
          Forgot your password?
        </Link>
        <FormMessage state={state ?? (notice ? { message: notice } : undefined)} />
        <SignInSubmit label="Log in" pendingLabel="Logging in..." />
      </form>
    </AuthCard>
  );
}
