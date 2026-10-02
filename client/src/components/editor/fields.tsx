"use client";

import type { ComponentProps } from "react";
import { type FieldPath, get, useFormContext, useFormState } from "react-hook-form";

import { FormField, TextareaField } from "@/components/form-field";
import type { ResumeFormValues } from "@/lib/resumes/form";

type Name = FieldPath<ResumeFormValues>;

function useFieldError(name: Name): string[] | undefined {
  const { control } = useFormContext<ResumeFormValues>();
  const { errors } = useFormState({ control, name });
  const message = get(errors, name)?.message;
  return typeof message === "string" ? [message] : undefined;
}

type TextFieldProps = Omit<ComponentProps<typeof FormField>, "name" | "errors"> & { name: Name };

// An input bound to the resume form by its path, e.g. "sections.0.title".
export function TextField({ name, ...props }: TextFieldProps) {
  const { register } = useFormContext<ResumeFormValues>();
  const errors = useFieldError(name);
  return <FormField {...props} {...register(name)} errors={errors} />;
}

type AreaFieldProps = Omit<ComponentProps<typeof TextareaField>, "name" | "errors"> & {
  name: Name;
};

export function AreaField({ name, ...props }: AreaFieldProps) {
  const { register } = useFormContext<ResumeFormValues>();
  const errors = useFieldError(name);
  return <TextareaField {...props} {...register(name)} errors={errors} />;
}
