import { AlertCircle, Check, LoaderCircle } from "lucide-react";

import type { SaveStatus as Status } from "@/components/editor/use-autosave";
import { Button } from "@/components/ui/button";

export function SaveStatus({ status, onRetry }: { status: Status; onRetry: () => void }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      {status.state === "saved" && (
        <>
          <Check className="size-4 text-primary" aria-hidden="true" />
          Saved
        </>
      )}
      {status.state === "dirty" && "Unsaved changes"}
      {status.state === "saving" && (
        <>
          <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />
          Saving...
        </>
      )}
      {status.state === "invalid" && (
        <span className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          Not saved. Fix the fields marked in red.
        </span>
      )}
      {status.state === "error" && (
        <span className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {status.message}
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </span>
      )}
    </div>
  );
}
