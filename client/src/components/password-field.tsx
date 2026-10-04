"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";

import { FieldShell } from "@/components/form-field";
import { Input } from "@/components/ui/input";

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, "type"> & {
  name: string;
  label: string;
  hint?: string;
  errors?: string[];
};

// A password input with a button to show what was typed, so there's no need to type it twice.
export function PasswordField({ name, label, hint, errors, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <FieldShell name={name} label={label} hint={hint} errors={errors}>
      {(describedBy, invalid) => (
        <div className="relative">
          <Input
            id={name}
            name={name}
            type={visible ? "text" : "password"}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="pr-10"
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </FieldShell>
  );
}
