import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = ComponentProps<typeof Input> & {
  name: string;
  label: string;
  errors?: string[];
};

export function FormField({ name, label, errors, ...inputProps }: FormFieldProps) {
  const errorId = `${name}-error`;
  const hasErrors = Boolean(errors?.length);

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        {...inputProps}
      />
      {hasErrors && (
        <p id={errorId} className="text-sm text-destructive">
          {errors?.join(" ")}
        </p>
      )}
    </div>
  );
}
