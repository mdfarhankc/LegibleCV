"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form-state";
import { deleteResume } from "@/lib/resumes/actions";

type DeleteDialogProps = {
  id: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteDialog({ id, title, open, onOpenChange }: DeleteDialogProps) {
  const [state, action, pending] = useActionState(
    async (previous: FormState, formData: FormData) => {
      const result = await deleteResume(previous, formData);
      if (result?.success) {
        onOpenChange(false);
      }
      return result;
    },
    undefined,
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{title}&rdquo; will be deleted permanently. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state?.message && <FormMessage state={state} />}
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting..." : "Delete resume"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
