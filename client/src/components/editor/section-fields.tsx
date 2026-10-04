"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import { DetailsFields } from "@/components/editor/details-fields";
import { EntriesFields } from "@/components/editor/entries-fields";
import { AreaField, TextField } from "@/components/editor/fields";
import { ItemControls } from "@/components/editor/item-controls";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillsFields } from "@/components/editor/skills-fields";
import type { ResumeFormValues, SectionValues } from "@/lib/resumes/form";

const TYPE_LABELS: Record<SectionValues["type"], string> = {
  text: "Text",
  entries: "Entries",
  skills: "Skill groups",
  details: "Details",
  bullets: "Bullet list",
  inline: "One-line list",
};

// What "Automatic" does for each type on the two-column templates.
const SIDE_BY_DEFAULT: SectionValues["type"][] = ["skills", "details", "bullets", "inline"];

function placementOptions(type: SectionValues["type"]) {
  const automatic = SIDE_BY_DEFAULT.includes(type) ? "side" : "main";
  return [
    { value: "auto", label: `Automatic (${automatic} column)` },
    { value: "main", label: "Main column" },
    { value: "side", label: "Side column" },
  ] as const;
}

function SectionBody({ index, type }: { index: number; type: SectionValues["type"] }) {
  switch (type) {
    case "text":
      return <AreaField name={`sections.${index}.content`} label="Text" rows={8} />;
    case "entries":
      return <EntriesFields sectionIndex={index} />;
    case "skills":
      return <SkillsFields sectionIndex={index} />;
    case "details":
      return <DetailsFields sectionIndex={index} />;
    case "bullets":
      return (
        <AreaField
          name={`sections.${index}.listText`}
          label="Bullet points"
          rows={8}
          hint="One per line. Wrap words in **two asterisks** to make them bold."
        />
      );
    case "inline":
      return (
        <AreaField
          name={`sections.${index}.listText`}
          label="Items"
          rows={5}
          hint="One per line. They print on a single line, separated by |."
        />
      );
  }
}

type SectionFieldsProps = {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
};

export function SectionFields({ index, count, onMove, onRemove }: SectionFieldsProps) {
  const { control } = useFormContext<ResumeFormValues>();
  const type = useWatch({ control, name: `sections.${index}.type` });
  const template = useWatch({ control, name: "template" });
  const options = placementOptions(type);
  const placementId = `sections.${index}.placement`;

  return (
    <section className="grid grid-cols-1 gap-5 rounded-xl border p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <TextField
            name={`sections.${index}.title`}
            label={`Section title (${TYPE_LABELS[type]})`}
            placeholder="Shown as the heading on the resume"
          />
        </div>
        {/* Up and down here mean earlier and later on the resume. */}
        <div className="pt-[1.6rem]">
          <ItemControls
            label="section"
            isFirst={index === 0}
            isLast={index === count - 1}
            onMoveUp={() => onMove(index - 1)}
            onMoveDown={() => onMove(index + 1)}
            onRemove={onRemove}
          />
        </div>
      </div>
      {/* Classic has one column, so there's nothing to choose. */}
      {template !== "classic" && (
        <div className="grid max-w-xs gap-2">
          <Label htmlFor={placementId}>Column</Label>
          <Controller
            control={control}
            name={`sections.${index}.placement`}
            render={({ field }) => (
              <Select items={options} value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={placementId} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}
      <SectionBody index={index} type={type} />
    </section>
  );
}
