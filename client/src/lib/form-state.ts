// State a Server Action hands back to useActionState.
export type FormState<Field extends string = never> =
  | {
      message?: string;
      success?: string;
      fieldErrors?: Partial<Record<Field, string[]>>;
    }
  | undefined;
