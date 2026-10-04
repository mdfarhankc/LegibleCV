"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { TextField } from "@/components/editor/fields";
import { Button } from "@/components/ui/button";
import { LIMITS, type ResumeFormValues } from "@/lib/resumes/form";

// What applications abroad usually ask for. Any other label can be typed in.
const SUGGESTIONS = [
  "Nationality",
  "Date of birth",
  "Visa status",
  "Passport",
  "Marital status",
  "Driving licence",
  "Notice period",
];

export function DetailsFields({ sectionIndex }: { sectionIndex: number }) {
  const { control } = useFormContext<ResumeFormValues>();
  const details = useFieldArray({ control, name: `sections.${sectionIndex}.details` });
  const current = useWatch({ control, name: `sections.${sectionIndex}.details` });

  const full = details.fields.length >= LIMITS.details;
  const used = new Set(current.map((detail) => detail.label.trim().toLowerCase()));
  const unused = SUGGESTIONS.filter((label) => !used.has(label.toLowerCase()));

  return (
    <div className="grid grid-cols-1 gap-3">
      <p className="text-sm text-muted-foreground">
        Each row prints as a label and a value, like &ldquo;Nationality: Indian&rdquo;.
      </p>
      {details.fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-start"
        >
          <TextField
            name={`sections.${sectionIndex}.details.${index}.label`}
            label="Label"
            placeholder="Nationality"
          />
          <TextField
            name={`sections.${sectionIndex}.details.${index}.value`}
            label="Value"
            placeholder="Indian"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive sm:mt-[1.6rem]"
            onClick={() => details.remove(index)}
            aria-label={`Remove detail ${index + 1}`}
          >
            <Trash2 />
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={full}
          onClick={() => details.append({ label: "", value: "" })}
        >
          <Plus />
          Add detail
        </Button>
        {unused.map((label) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="sm"
            disabled={full}
            onClick={() => details.append({ label, value: "" })}
          >
            <Plus />
            {label}
          </Button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Leave out full passport and ID numbers. A resume gets forwarded and uploaded to job sites,
        and &ldquo;Passport: valid until 2031&rdquo; tells an employer what they need.
      </p>
    </div>
  );
}
