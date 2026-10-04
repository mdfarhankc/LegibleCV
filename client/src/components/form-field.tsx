import type { ComponentProps, ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FieldShellProps = {
  name: string;
  label: string;
  hint?: string;
  errors?: string[];
  children: (describedBy: string | undefined, invalid: boolean) => ReactNode;
};

// Label, control, then the error (or the hint when there's no error).
export function FieldShell({ name, label, hint, errors, children }: FieldShellProps) {
  const hasErrors = Boolean(errors?.length);
  const noteId = hasErrors || hint ? `${name}-note` : undefined;

  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children(noteId, hasErrors)}
      {hasErrors ? (
        <p id={noteId} className="text-sm text-destructive">
          {errors?.join(" ")}
        </p>
      ) : (
        hint && (
          <p id={noteId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type SharedProps = {
  name: string;
  label: string;
  hint?: string;
  errors?: string[];
};

type FormFieldProps = ComponentProps<typeof Input> & SharedProps;

export function FormField({ name, label, hint, errors, ...inputProps }: FormFieldProps) {
  return (
    <FieldShell name={name} label={label} hint={hint} errors={errors}>
      {(describedBy, invalid) => (
        <Input
          id={name}
          name={name}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          {...inputProps}
        />
      )}
    </FieldShell>
  );
}

type TextareaFieldProps = ComponentProps<typeof Textarea> & SharedProps;

export function TextareaField({ name, label, hint, errors, ...textareaProps }: TextareaFieldProps) {
  return (
    <FieldShell name={name} label={label} hint={hint} errors={errors}>
      {(describedBy, invalid) => (
        <Textarea
          id={name}
          name={name}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          {...textareaProps}
        />
      )}
    </FieldShell>
  );
}
