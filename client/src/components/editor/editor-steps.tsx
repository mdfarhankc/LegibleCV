"use client";

import { ArrowLeft, ArrowRight, ChevronRight, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type Control, useFieldArray, useFormContext, useFormState, useWatch } from "react-hook-form";

import { ContactFields } from "@/components/editor/contact-fields";
import { TextField } from "@/components/editor/fields";
import { OptionsFields } from "@/components/editor/options-fields";
import { SectionFields } from "@/components/editor/section-fields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { emptySection, LIMITS, type ResumeFormValues, SECTION_PRESETS } from "@/lib/resumes/form";

// The editor shows one step at a time: Basics, then each section in resume order, then Output.
type Step = { kind: "basics" } | { kind: "section"; index: number } | { kind: "output" };

const BASICS_FIELDS = ["title", "full_name", "email", "phone", "location", "links"] as const;

function stepName(step: Step, sectionTitle: string | undefined): string {
  if (step.kind === "basics") {
    return "Basics";
  }
  if (step.kind === "output") {
    return "Output";
  }
  return sectionTitle?.trim() || "Untitled section";
}

function sameStep(a: Step, b: Step): boolean {
  return a.kind === b.kind && (a.kind !== "section" || a.index === (b as typeof a).index);
}

type StepNavProps = {
  control: Control<ResumeFormValues>;
  steps: Step[];
  current: Step;
  onSelect: (step: Step) => void;
  onAdd: (type: (typeof SECTION_PRESETS)[number]) => void;
  canAdd: boolean;
};

function StepNav({ control, steps, current, onSelect, onAdd, canAdd }: StepNavProps) {
  const sections = useWatch({ control, name: "sections" });
  const { errors } = useFormState({ control });

  // On a phone the steps sit in one row that scrolls sideways, so the current one is kept in view.
  const activeButton = useRef<HTMLButtonElement>(null);
  const activePosition = steps.findIndex((step) => sameStep(step, current));
  useEffect(() => {
    activeButton.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activePosition]);

  function label(step: Step): string {
    return stepName(step, step.kind === "section" ? sections[step.index]?.title : undefined);
  }

  // A field on a step that isn't on screen can still block saving, so the step is marked.
  function hasError(step: Step): boolean {
    if (step.kind === "basics") {
      return BASICS_FIELDS.some((field) => errors[field]);
    }
    return step.kind === "section" && Boolean(errors.sections?.[step.index]);
  }

  return (
    <nav aria-label="Resume steps">
      <ol className="flex items-center gap-x-1 gap-y-2 text-sm [scrollbar-width:none] max-sm:-m-1 max-sm:overflow-x-auto max-sm:p-1 sm:flex-wrap">
        {steps.map((step, position) => {
          const active = sameStep(step, current);
          return (
            <li key={position} className="flex shrink-0 items-center gap-1">
              {position > 0 && (
                <ChevronRight className="size-4 text-muted-foreground/60" aria-hidden="true" />
              )}
              <button
                ref={active ? activeButton : undefined}
                type="button"
                onClick={() => onSelect(step)}
                aria-current={active ? "step" : undefined}
                className={`flex max-w-48 items-center gap-1.5 rounded-md px-2 py-1 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="truncate">{label(step)}</span>
                {hasError(step) && (
                  <>
                    <span className="size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden="true" />
                    <span className="sr-only">has errors</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
        <li className="ml-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button type="button" variant="outline" size="sm" disabled={!canAdd} />}
            >
              <Plus />
              Add section
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {SECTION_PRESETS.map((preset) => (
                <DropdownMenuItem key={preset.label} onClick={() => onAdd(preset)}>
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ol>
    </nav>
  );
}

export function EditorSteps({ resumeId }: { resumeId: string }) {
  const { control, getValues } = useFormContext<ResumeFormValues>();
  const sections = useFieldArray({ control, name: "sections" });
  const [selected, setSelected] = useState<Step>({ kind: "basics" });
  const [removing, setRemoving] = useState<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  const steps: Step[] = [
    { kind: "basics" },
    ...sections.fields.map((_, index): Step => ({ kind: "section", index })),
    { kind: "output" },
  ];
  // A section step can outlive its section (removed in this tab); fall back to the first step.
  const position = Math.max(0, steps.findIndex((step) => sameStep(step, selected)));
  const current = steps[position];
  const previous = steps[position - 1];
  const next = steps[position + 1];

  function goTo(step: Step) {
    setSelected(step);
    panel.current?.scrollTo({ top: 0 });
  }

  function nameOf(step: Step): string {
    return stepName(
      step,
      step.kind === "section" ? getValues(`sections.${step.index}.title`) : undefined,
    );
  }

  function removeSection(index: number) {
    sections.remove(index);
    goTo(index > 0 ? { kind: "section", index: index - 1 } : { kind: "basics" });
  }

  const removingTitle = removing === null ? "" : getValues(`sections.${removing}.title`);

  return (
    // The steps bar and the Previous / Next buttons stay put; only the step itself scrolls.
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 pb-4">
        <StepNav
          control={control}
          steps={steps}
          current={current}
          onSelect={goTo}
          canAdd={sections.fields.length < LIMITS.sections}
          onAdd={(preset) => {
            sections.append(emptySection(preset.type, preset.title));
            goTo({ kind: "section", index: sections.fields.length });
          }}
        />
      </div>

      <div ref={panel} className="min-h-0 flex-1 overflow-y-auto pr-2 [scrollbar-width:thin]">
        {current.kind === "basics" && (
          <div className="grid gap-6">
            <TextField
              name="title"
              label="Resume name"
              hint="Only you see this. It isn't printed on the resume."
            />
            <ContactFields resumeId={resumeId} />
          </div>
        )}
        {current.kind === "section" && (
          <SectionFields
            // Keyed by the field id so each section gets its own inputs.
            key={sections.fields[current.index].id}
            index={current.index}
            count={sections.fields.length}
            onMove={(to) => {
              sections.move(current.index, to);
              setSelected({ kind: "section", index: to });
            }}
            onRemove={() => setRemoving(current.index)}
          />
        )}
        {current.kind === "output" && <OptionsFields />}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4">
        {previous ? (
          <Button type="button" variant="outline" size="lg" onClick={() => goTo(previous)}>
            <ArrowLeft />
            <span className="max-w-56 truncate">{nameOf(previous)}</span>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button type="button" size="lg" onClick={() => goTo(next)}>
            <span className="max-w-64 truncate">Next: {nameOf(next)}</span>
            <ArrowRight />
          </Button>
        )}
      </div>

      <AlertDialog open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this section?</AlertDialogTitle>
            <AlertDialogDescription>
              {removingTitle ? `"${removingTitle}"` : "This section"} and everything in it will be
              removed from the resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (removing !== null) {
                  removeSection(removing);
                }
                setRemoving(null);
              }}
            >
              Remove section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
