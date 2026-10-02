"use client";

import { Plus } from "lucide-react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { AreaField, TextField } from "@/components/editor/fields";
import { ItemControls } from "@/components/editor/item-controls";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { emptyEntry, LIMITS, type ResumeFormValues } from "@/lib/resumes/form";

type EntryProps = {
  sectionIndex: number;
  entryIndex: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
};

function EntryFields({ sectionIndex, entryIndex, count, onMove, onRemove }: EntryProps) {
  const { control } = useFormContext<ResumeFormValues>();
  const path = `sections.${sectionIndex}.items.${entryIndex}` as const;
  const isCurrent = useWatch({ control, name: `${path}.is_current` });
  const title = useWatch({ control, name: `${path}.title` });
  const currentId = `${path}.is_current`;

  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="min-w-0 truncate font-medium">{title || `Entry ${entryIndex + 1}`}</h4>
        <ItemControls
          label={`entry ${entryIndex + 1}`}
          isFirst={entryIndex === 0}
          isLast={entryIndex === count - 1}
          onMoveUp={() => onMove(entryIndex - 1)}
          onMoveDown={() => onMove(entryIndex + 1)}
          onRemove={onRemove}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name={`${path}.title`}
          label="Title"
          hint="Company, project, school, or award."
        />
        <TextField name={`${path}.subtitle`} label="Subtitle" hint="Role, degree, or issuer." />
        <TextField name={`${path}.location`} label="Location" />
        <div className="grid grid-cols-2 gap-3">
          <TextField name={`${path}.start`} label="Start" placeholder="MAR 2023" />
          <TextField
            name={`${path}.end`}
            label="End"
            placeholder="JAN 2025"
            // Read-only, not disabled: a disabled field would drop out of the form's values.
            readOnly={isCurrent}
            className={isCurrent ? "opacity-50" : undefined}
          />
          <div className="col-span-2 flex items-center gap-2">
            <Controller
              control={control}
              name={`${path}.is_current`}
              render={({ field }) => (
                <Switch
                  id={currentId}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor={currentId}>I&apos;m still here (shows &ldquo;Present&rdquo;)</Label>
          </div>
        </div>
      </div>

      <TextField
        name={`${path}.meta`}
        label="Extra line"
        hint="Shown small under the title. Good for a project's tech stack."
      />
      <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <TextField name={`${path}.link_label`} label="Link label" placeholder="GitHub" />
        <TextField
          name={`${path}.link_url`}
          label="Link address"
          type="url"
          placeholder="https://github.com/you/project"
        />
      </div>
      <AreaField name={`${path}.description`} label="Description" rows={2} />
      <AreaField
        name={`${path}.bullets`}
        label="Bullet points"
        rows={5}
        hint="One per line. Wrap words in **two asterisks** to make them bold."
      />
    </div>
  );
}

export function EntriesFields({ sectionIndex }: { sectionIndex: number }) {
  const { control } = useFormContext<ResumeFormValues>();
  const entries = useFieldArray({ control, name: `sections.${sectionIndex}.items` });

  return (
    <div className="grid grid-cols-1 gap-4">
      {entries.fields.map((field, index) => (
        <EntryFields
          key={field.id}
          sectionIndex={sectionIndex}
          entryIndex={index}
          count={entries.fields.length}
          onMove={(to) => entries.move(index, to)}
          onRemove={() => entries.remove(index)}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        disabled={entries.fields.length >= LIMITS.entries}
        onClick={() => entries.append(emptyEntry())}
      >
        <Plus />
        Add entry
      </Button>
    </div>
  );
}
