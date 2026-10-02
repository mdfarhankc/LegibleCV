"use client";

import type { ReactNode } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ResumeFormValues, TemplateName } from "@/lib/resumes/form";

const PAGE_SIZES = [
  { value: "A4", label: "A4 (most countries)" },
  { value: "Letter", label: "Letter (US, Canada)" },
] as const;

const line = "h-0.5 rounded-full bg-black/25";

// Small diagrams of each layout. Drawn on white, like the page itself.
const DIAGRAMS: Record<TemplateName, ReactNode> = {
  classic: (
    <div className="grid h-full content-start gap-1 p-2">
      <div className="mx-auto h-1 w-1/2 rounded-full bg-black/60" />
      <div className={`${line} mx-auto w-2/3`} />
      <div className="mt-1 h-px bg-black/50" />
      <div className={line} />
      <div className={`${line} w-4/5`} />
      <div className="mt-1 h-px bg-black/50" />
      <div className={line} />
      <div className={`${line} w-3/4`} />
      <div className={line} />
    </div>
  ),
  sidepanel: (
    <div className="flex h-full">
      <div className="grid w-1/3 content-start gap-1 bg-[#eef0f6]">
        <div className="h-4 rounded-b-[50%] bg-[#0d1746]" />
        <div className={`${line} mx-1`} />
        <div className={`${line} mx-1 w-1/2`} />
        <div className={`${line} mx-1`} />
      </div>
      <div className="grid flex-1 content-start gap-1 p-1.5">
        <div className="h-px bg-black/40" />
        <div className={line} />
        <div className={`${line} w-4/5`} />
        <div className="mt-1 h-px bg-black/40" />
        <div className={line} />
        <div className={`${line} w-2/3`} />
      </div>
    </div>
  ),
  banner: (
    <div className="flex h-full flex-col">
      <div className="grid h-5 content-center gap-0.5 bg-[#2e3443] px-1.5">
        <div className="h-1 w-1/2 rounded-full bg-white/90" />
        <div className="h-0.5 w-2/3 rounded-full bg-white/50" />
      </div>
      <div className="flex flex-1">
        <div className="grid flex-1 content-start gap-1 border-r border-black/15 p-1.5">
          <div className={line} />
          <div className={`${line} w-4/5`} />
          <div className="mt-1 h-px bg-black/20" />
          <div className={line} />
          <div className={`${line} w-2/3`} />
        </div>
        <div className="grid w-1/3 content-start gap-1 p-1.5">
          <div className={line} />
          <div className={`${line} w-2/3`} />
          <div className={line} />
        </div>
      </div>
    </div>
  ),
};

const TEMPLATE_OPTIONS: { value: TemplateName; label: string; note: string }[] = [
  { value: "classic", label: "Classic", note: "One column. Works with ATS software." },
  { value: "sidepanel", label: "Side panel", note: "Two columns. Not suited to ATS software." },
  { value: "banner", label: "Banner", note: "Two columns. Not suited to ATS software." },
];

export function OptionsFields() {
  const { control } = useFormContext<ResumeFormValues>();
  const template = useWatch({ control, name: "template" });
  const twoColumn = template !== "classic";

  return (
    <section className="grid grid-cols-1 gap-6 rounded-xl border p-5 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">Output</h2>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm font-medium">Template</legend>
        <Controller
          control={control}
          name="template"
          render={({ field }) => (
            <div className="grid gap-3 sm:grid-cols-3">
              {TEMPLATE_OPTIONS.map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={field.value === option.value}
                    onChange={() => field.onChange(option.value)}
                    className="peer sr-only"
                  />
                  <div className="grid gap-2 rounded-lg border p-3 transition-colors peer-checked:border-primary peer-checked:bg-primary/5 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:border-primary/60">
                    <div className="mx-auto h-24 w-[4.25rem] overflow-hidden rounded-[2px] bg-white ring-1 ring-black/15">
                      {DIAGRAMS[option.value]}
                    </div>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.note}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        />
        {twoColumn && (
          <p className="text-sm text-muted-foreground">
            Job portals often read resumes with software that expects a single column. A two-column
            layout can come out with its text in the wrong order. Use this template when a person
            will read the file, and Classic when applying through a portal. The Word download
            stays single-column.
          </p>
        )}
      </fieldset>

      <div className="flex items-start gap-3">
        <Controller
          control={control}
          name="ats_mode"
          render={({ field }) => (
            <Switch
              id="ats_mode"
              className="mt-0.5"
              checked={field.value && !twoColumn}
              onCheckedChange={field.onChange}
              disabled={twoColumn}
            />
          )}
        />
        <div className="grid gap-1">
          <Label htmlFor="ats_mode">ATS mode</Label>
          <p className="text-sm text-muted-foreground">
            {twoColumn
              ? "Only available with the Classic template."
              : "Plain black text, and links printed as addresses (linkedin.com/in/you) instead of labels. Use it when applying through a job portal."}
          </p>
        </div>
      </div>

      <div className="grid max-w-xs gap-2">
        <Label htmlFor="page_size">Page size</Label>
        <Controller
          control={control}
          name="page_size"
          render={({ field }) => (
            <Select items={PAGE_SIZES} value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="page_size" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </section>
  );
}
