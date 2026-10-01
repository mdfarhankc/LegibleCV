"use client";

import { Plus } from "lucide-react";
import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { createResume } from "@/lib/resumes/actions";

export function NewResumeButton({ atLimit }: { atLimit: boolean }) {
  const [state, action, pending] = useActionState(createResume, undefined);

  return (
    <form action={action} className="grid justify-items-start gap-2 sm:justify-items-end">
      <Button type="submit" size="lg" disabled={atLimit || pending}>
        <Plus />
        {pending ? "Creating..." : "New resume"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
