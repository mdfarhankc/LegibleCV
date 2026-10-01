import { z } from "zod";

export const resumeIdSchema = z.uuid();

// Same bounds as the check constraint on resumes.title.
export const resumeTitleSchema = z
  .string()
  .trim()
  .min(1, "Give the resume a title.")
  .max(120, "Use at most 120 characters.");
