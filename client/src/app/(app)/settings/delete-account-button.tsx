"use client";

import { useActionState, useState } from "react";

import { FormField } from "@/components/form-field";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/lib/auth/account-actions";

export function DeleteAccountButton({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  const [confirmation, setConfirmation] = useState("");
  const confirmed = confirmation.trim().toLowerCase() === email.toLowerCase();

  function changeOpen(next: boolean) {
    if (pending) {
      return;
    }
    setOpen(next);
    if (!next) {
      setConfirmation("");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="justify-self-start md:justify-self-end"
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your account, every resume in it and their photos are deleted for good. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="grid gap-4">
            <FormField
              name="confirmation"
              label={`Type ${email} to confirm`}
              type="email"
              autoComplete="off"
              autoFocus
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              errors={state?.fieldErrors?.confirmation}
            />
            <FormMessage state={state} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => changeOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={pending || !confirmed}>
                {pending ? "Deleting account..." : "Delete account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
