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
import type { FormState } from "@/lib/form-state";
import { renameResume } from "@/lib/resumes/actions";
import { RESUME_TITLE_MAX } from "@/lib/resumes/schemas";

type RenameDialogProps = {
  id: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RenameDialog({ id, title, open, onOpenChange }: RenameDialogProps) {
  const [value, setValue] = useState(title);
  const [state, action, pending] = useActionState(
    async (previous: FormState<"title">, formData: FormData) => {
      const result = await renameResume(previous, formData);
      if (result?.success) {
        onOpenChange(false);
      }
      return result;
    },
    undefined,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename resume</DialogTitle>
          <DialogDescription>Only you see this name. It isn&apos;t printed on the resume.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <input type="hidden" name="id" value={id} />
          <FormField
            name="title"
            label="Title"
            required
            maxLength={RESUME_TITLE_MAX}
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            errors={state?.fieldErrors?.title}
          />
          {state?.message && <FormMessage state={state} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
