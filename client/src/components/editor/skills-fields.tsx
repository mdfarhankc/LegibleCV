"use client";

import { Plus } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { TextField } from "@/components/editor/fields";
import { ItemControls } from "@/components/editor/item-controls";
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
          <div className="sm:mt-[1.6rem] sm:pt-0.5">
            <ItemControls
              label={`group ${index + 1}`}
              isFirst={index === 0}
              isLast={index === groups.fields.length - 1}
              onMoveUp={() => groups.move(index, index - 1)}
              onMoveDown={() => groups.move(index, index + 1)}
              onRemove={() => groups.remove(index)}
            />
          </div>
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
