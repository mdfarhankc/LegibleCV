"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// One sign-in at a time on an auth card: while Google, GitHub, a passkey or the email form is
// working, the other ways in are disabled.

type Method = "oauth" | "passkey" | "email";

type SignInBusy = {
  busy: Method | null;
  report: (method: Method, pending: boolean) => void;
};

// Outside a provider nothing is shared, so every control only answers for itself.
const SignInBusyContext = createContext<SignInBusy>({ busy: null, report: () => {} });

export function SignInBusyProvider({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState<Method | null>(null);
  const report = useCallback((method: Method, pending: boolean) => {
    setBusy((current) => (pending ? method : current === method ? null : current));
  }, []);

  return <SignInBusyContext value={{ busy, report }}>{children}</SignInBusyContext>;
}

// Tells the card whether this method is working. True while a different one is.
export function useOtherSignInBusy(method: Method, pending: boolean): boolean {
  const { busy, report } = useContext(SignInBusyContext);
  useEffect(() => {
    report(method, pending);
  }, [method, pending, report]);
  return busy !== null && busy !== method;
}

type SignInSubmitProps = {
  label: string;
  pendingLabel: string;
};

// The email form's submit button. Reads the form's status, so it has to be inside the form.
export function SignInSubmit({ label, pendingLabel }: SignInSubmitProps) {
  const { pending } = useFormStatus();
  const otherBusy = useOtherSignInBusy("email", pending);

  return (
    <Button type="submit" className="w-full" disabled={pending || otherBusy}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
