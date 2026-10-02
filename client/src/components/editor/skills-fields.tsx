"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { TextField } from "@/components/editor/fields";
import { Button } from "@/components/ui/button";
import { LIMITS, type ResumeFormValues } from "@/lib/resumes/form";

export function SkillsFields({ sectionIndex }: { sectionIndex: number }) {
  const { control } = useFormContext<ResumeFormValues>();
  const groups = useFieldArray({ control, name: `sections.${sectionIndex}.groups` });

  return (
    <div className="grid grid-cols-1 gap-3">
      <p className="text-sm text-muted-foreground">
        Each group prints as one line, like &ldquo;Databases: PostgreSQL, Redis&rdquo;.
      </p>
      {groups.fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-start"
        >
          <TextField
            name={`sections.${sectionIndex}.groups.${index}.label`}
            label="Group"
            placeholder="Databases"
          />
          <TextField
            name={`sections.${sectionIndex}.groups.${index}.items`}
            label="Skills, separated by commas"
            placeholder="PostgreSQL, MySQL, Redis"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive sm:mt-[1.6rem]"
            onClick={() => groups.remove(index)}
            aria-label={`Remove group ${index + 1}`}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        disabled={groups.fields.length >= LIMITS.groups}
        onClick={() => groups.append({ label: "", items: "" })}
      >
        <Plus />
        Add group
      </Button>
    </div>
  );
}
