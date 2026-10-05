"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { signOutOtherDevices } from "@/lib/auth/account-actions";

export function OtherDevicesForm() {
  const [state, action, pending] = useActionState(signOutOtherDevices, undefined);

  return (
    <form action={action} className="grid content-start gap-4">
      <FormMessage state={state} />
      <Button type="submit" variant="outline" className="justify-self-start" disabled={pending}>
        {pending ? "Logging out..." : "Log out of other devices"}
      </Button>
    </form>
  );
}
