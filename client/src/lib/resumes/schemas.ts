import { z } from "zod";

export const resumeIdSchema = z.uuid();

// Same bounds as the check constraint on resumes.title.
export const RESUME_TITLE_MAX = 120;

export const resumeTitleSchema = z
  .string()
  .trim()
  .min(1, "Give the resume a title.")
  .max(RESUME_TITLE_MAX, `Use at most ${RESUME_TITLE_MAX} characters.`);
