import type { FormState } from "@/lib/form-state";

export function FormMessage({ state }: { state: FormState<string> }) {
  if (state?.message) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.message}
      </p>
    );
  }
  if (state?.success) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {state.success}
      </p>
    );
  }
  return null;
}
