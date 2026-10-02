"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { type Control, FormProvider, useForm, useWatch } from "react-hook-form";

import { EditorSteps } from "@/components/editor/editor-steps";
import { PreviewPane } from "@/components/editor/preview-pane";
import { SaveStatus } from "@/components/editor/save-status";
import { useAutosave } from "@/components/editor/use-autosave";
import { Button } from "@/components/ui/button";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";
import { resumeFormSchema, type ResumeFormValues } from "@/lib/resumes/form";

type ResumeEditorProps = {
  resumeId: string;
  initialValues: ResumeFormValues;
};

const DOWNLOADS = [
  { format: "pdf", label: "PDF" },
  { format: "docx", label: "Word" },
] as const;

type DownloadsProps = {
  resumeId: string;
  control: Control<ResumeFormValues>;
  saved: boolean;
};

// The files are rendered from the saved resume, so they wait for autosave to finish.
function Downloads({ resumeId, control, saved }: DownloadsProps) {
  const [fullName, email] = useWatch({ control, name: ["full_name", "email"] });
  const reason = !fullName.trim() || !email.trim()
    ? "Add your name and email to download."
    : !saved
      ? "Available once your changes are saved."
      : null;

  return (
    <div className="flex items-center gap-2">
      {DOWNLOADS.map(({ format, label }) =>
        reason ? (
          <Button key={format} type="button" variant="outline" disabled title={reason}>
            <Download />
            {label}
          </Button>
        ) : (
          <Button
            key={format}
            variant="outline"
            nativeButton={false}
            render={<a href={`/editor/${resumeId}/export/${format}`} download />}
          >
            <Download />
            {label}
          </Button>
        ),
      )}
    </div>
  );
}

export function ResumeEditor({ resumeId, initialValues }: ResumeEditorProps) {
  const form = useForm<ResumeFormValues>({
    resolver: zodResolver(resumeFormSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });
  const { status, retry } = useAutosave(resumeId, form);
  // Below the xl breakpoint there's room for one of the two at a time.
  const [view, setView] = useState<"edit" | "preview">("edit");

  return (
    <FormProvider {...form}>
      {/*
        Nothing to submit: autosave stores every change.
        The editor is exactly as tall as the screen below the site header (h-14 plus its border),
        so the page never scrolls. The form and the preview scroll inside their own columns.
      */}
      <form
        onSubmit={(event) => event.preventDefault()}
        className="flex h-[calc(100dvh-3.5rem-1px)] flex-col"
      >
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
          <Link
            href={DEFAULT_SIGNED_IN_PATH}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Your resumes
          </Link>
          <SaveStatus status={status} onRetry={() => void retry()} />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="xl:hidden"
              onClick={() => setView(view === "edit" ? "preview" : "edit")}
            >
              {view === "edit" ? "Show preview" : "Back to editing"}
            </Button>
            <Downloads
              resumeId={resumeId}
              control={form.control}
              saved={status.state === "saved"}
            />
          </div>
        </div>

        <div className="mx-auto grid min-h-0 w-full max-w-[100rem] flex-1 xl:grid-cols-[minmax(0,46rem)_minmax(0,1fr)]">
          <div className={`min-h-0 min-w-0 px-4 py-4 ${view === "edit" ? "block" : "hidden xl:block"}`}>
            <EditorSteps />
          </div>

          <div className={`min-h-0 min-w-0 px-4 py-4 ${view === "preview" ? "block" : "hidden xl:block"}`}>
            <PreviewPane />
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
