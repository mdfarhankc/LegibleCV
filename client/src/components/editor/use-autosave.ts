import { useCallback, useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { saveResume } from "@/lib/resumes/actions";
import type { ResumeFormValues } from "@/lib/resumes/form";

export type SaveStatus =
  | { state: "saved" }
  | { state: "dirty" }
  | { state: "saving" }
  | { state: "invalid" }
  | { state: "error"; message: string };

const DELAY_MS = 1000;

export function useAutosave(resumeId: string, form: UseFormReturn<ResumeFormValues>) {
  const [status, setStatus] = useState<SaveStatus>({ state: "saved" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef(false);
  // A change arrived while a save was running, so another save is needed after it.
  const changedDuringSave = useRef(false);

  const save = useCallback(async () => {
    if (saving.current) {
      changedDuringSave.current = true;
      return;
    }

    saving.current = true;
    try {
      // Repeats while changes keep arriving, so the last thing typed is what ends up stored.
      do {
        changedDuringSave.current = false;
        // Runs the schema and puts any errors on the fields.
        if (!(await form.trigger())) {
          setStatus({ state: "invalid" });
          return;
        }
        setStatus({ state: "saving" });
        const result = await saveResume(resumeId, form.getValues()).catch(() => ({
          ok: false as const,
          message: "Could not save. Check your connection and retry.",
        }));
        if (!result.ok) {
          setStatus({ state: "error", message: result.message });
          return;
        }
      } while (changedDuringSave.current);
      setStatus({ state: "saved" });
    } finally {
      saving.current = false;
    }
  }, [form, resumeId]);

  useEffect(() => {
    const subscription = form.watch(() => {
      setStatus((current) => (current.state === "saving" ? current : { state: "dirty" }));
      if (saving.current) {
        changedDuringSave.current = true;
      }
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => void save(), DELAY_MS);
    });
    return () => {
      subscription.unsubscribe();
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [form, save]);

  // The browser's own "leave site?" prompt while something isn't saved yet.
  const unsaved = status.state !== "saved";
  useEffect(() => {
    if (!unsaved) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  return { status, retry: save };
}
