"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getUser, requireUser } from "@/lib/auth/dal";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";
import type { FormState } from "@/lib/form-state";
import { DEFAULT_RESUME_TITLE, newResumeData } from "@/lib/resumes/defaults";
import { resumeFormSchema, toResume } from "@/lib/resumes/form";
import {
  isJpeg,
  newPhotoPath,
  PHOTO_BUCKET,
  PHOTO_MAX_BYTES,
  removeResumePhotos,
} from "@/lib/resumes/photo";
import { renderResume } from "@/lib/resumes/render";
import { resumeIdSchema, resumeTitleSchema } from "@/lib/resumes/schemas";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

// Raised by the enforce_resume_limit trigger.
function isLimitError(error: { code: string; message: string }): boolean {
  return error.code === "P0001" && error.message.startsWith("Resume limit");
}

export async function createResume(): Promise<FormState> {
  const user = await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .insert({ title: DEFAULT_RESUME_TITLE, data: newResumeData(user) as unknown as Json })
    .select("id")
    .single();
  if (error) {
    return {
      message: isLimitError(error)
        ? "You've reached your resume limit. Delete one to create another."
        : "Could not create the resume. Try again.",
    };
  }

  revalidatePath(DEFAULT_SIGNED_IN_PATH);
  redirect(`/editor/${data.id}`);
}

export async function renameResume(
  _state: FormState<"title">,
  formData: FormData,
): Promise<FormState<"title">> {
  await requireUser();

  const id = resumeIdSchema.safeParse(formData.get("id"));
  if (!id.success) {
    return { message: "Could not rename the resume. Try again." };
  }
  const title = resumeTitleSchema.safeParse(formData.get("title"));
  if (!title.success) {
    return { fieldErrors: { title: title.error.issues.map((issue) => issue.message) } };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("resumes").update({ title: title.data }).eq("id", id.data);
  if (error) {
    return { message: "Could not rename the resume. Try again." };
  }

  revalidatePath(DEFAULT_SIGNED_IN_PATH);
  return { success: "Renamed." };
}

export async function deleteResume(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const id = resumeIdSchema.safeParse(formData.get("id"));
  if (!id.success) {
    return { message: "Could not delete the resume. Try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("resumes").delete().eq("id", id.data);
  if (error) {
    return { message: "Could not delete the resume. Try again." };
  }
  await removeResumePhotos(supabase, user.id, id.data);

  revalidatePath(DEFAULT_SIGNED_IN_PATH);
  return { success: "Deleted." };
}

export type DuplicateResult = { ok: true } | { ok: false; message: string };

const COPY_SUFFIX = " (copy)";
const MAX_TITLE_LENGTH = 120;

// Copies a resume as it is stored. The limit trigger applies to the copy like any new resume.
export async function duplicateResume(id: string): Promise<DuplicateResult> {
  const user = await requireUser();

  const resumeId = resumeIdSchema.safeParse(id);
  if (!resumeId.success) {
    return { ok: false, message: "Could not duplicate the resume." };
  }

  const supabase = await createClient();
  const { data: original, error: readError } = await supabase
    .from("resumes")
    .select("title, data, photo_path")
    .eq("id", resumeId.data)
    .maybeSingle();
  if (readError || !original) {
    return { ok: false, message: "Could not duplicate the resume." };
  }

  // Keeps the copy's title inside the column's length limit.
  const title = original.title.slice(0, MAX_TITLE_LENGTH - COPY_SUFFIX.length) + COPY_SUFFIX;
  const { data: copy, error } = await supabase
    .from("resumes")
    .insert({ title, data: original.data })
    .select("id")
    .single();
  if (error) {
    return {
      ok: false,
      message: isLimitError(error)
        ? "You've reached your resume limit. Delete one to duplicate this."
        : "Could not duplicate the resume. Try again.",
    };
  }

  // The copy gets its own file, so deleting either resume leaves the other's photo alone.
  // If this fails the copy simply has no photo.
  if (original.photo_path) {
    const path = newPhotoPath(user.id, copy.id);
    const copied = await supabase.storage.from(PHOTO_BUCKET).copy(original.photo_path, path);
    if (!copied.error) {
      await supabase.from("resumes").update({ photo_path: path }).eq("id", copy.id);
    }
  }

  revalidatePath(DEFAULT_SIGNED_IN_PATH);
  return { ok: true };
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; message: string };

// Called by autosave. Returns a result instead of redirecting, so what was typed stays on screen.
export async function saveResume(id: string, values: unknown): Promise<SaveResult> {
  if (!(await getUser())) {
    return { ok: false, message: "Your session ended. Log in again in another tab, then retry." };
  }
  const resumeId = resumeIdSchema.safeParse(id);
  if (!resumeId.success) {
    return { ok: false, message: "This resume can't be saved." };
  }
  const parsed = resumeFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: "Some fields need fixing before this can be saved." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .update({ title: parsed.data.title, data: toResume(parsed.data) as unknown as Json })
    .eq("id", resumeId.data)
    .select("updated_at")
    .maybeSingle();
  if (error) {
    return { ok: false, message: "Could not save. Check your connection and retry." };
  }
  if (!data) {
    return { ok: false, message: "This resume no longer exists." };
  }
  return { ok: true, savedAt: data.updated_at };
}

export type PreviewResult =
  | { ok: true; html: string; pageCount: number | null }
  // `unavailable` means the render service didn't answer and the preview should try again.
  | { ok: false; message: string; unavailable?: boolean };

// The PDF embeds the template's font. The preview frame loads the same fonts, so line breaks match.
const PREVIEW_FONT_LINK =
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap">';

// Renders the form as it is right now, saved or not.
export async function renderPreview(values: unknown): Promise<PreviewResult> {
  if (!(await getUser())) {
    return { ok: false, message: "Your session ended. Log in again." };
  }
  const parsed = resumeFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: "Fix the fields marked in red to update the preview." };
  }

  const resume = toResume(parsed.data);
  const result = await renderResume(
    "preview",
    {
      ...resume,
      // The contract needs both. Placeholders keep a new resume previewable.
      full_name: resume.full_name || "Your Name",
      email: resume.email || "you@example.com",
    },
    parsed.data.photo_path,
  );
  if (!result.ok) {
    return { ok: false, message: result.message, unavailable: result.unavailable };
  }

  // How many pages the PDF will have. Only the render service's PDF layout knows this.
  const pageCount = Number(result.response.headers.get("X-Page-Count"));
  const html = await result.response.text();
  return {
    ok: true,
    html: html.replace("<head>", `<head>${PREVIEW_FONT_LINK}`),
    pageCount: Number.isInteger(pageCount) && pageCount > 0 ? pageCount : null,
  };
}

export type PhotoResult = { ok: true; photoPath: string | null } | { ok: false; message: string };

const PHOTO_FAILED = { ok: false as const, message: "Could not save the photo. Try again." };

// The browser sends a small square JPEG. It's checked again here because the browser isn't trusted.
export async function uploadResumePhoto(id: string, formData: FormData): Promise<PhotoResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, message: "Your session ended. Log in again." };
  }
  const resumeId = resumeIdSchema.safeParse(id);
  const file = formData.get("photo");
  if (!resumeId.success || !(file instanceof File)) {
    return PHOTO_FAILED;
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return { ok: false, message: "That photo is too large." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isJpeg(bytes)) {
    return { ok: false, message: "That file isn't an image this app can use." };
  }

  const supabase = await createClient();
  // RLS returns nothing for a resume that isn't the user's.
  const { data: resume, error: readError } = await supabase
    .from("resumes")
    .select("photo_path")
    .eq("id", resumeId.data)
    .maybeSingle();
  if (readError || !resume) {
    return PHOTO_FAILED;
  }

  const path = newPhotoPath(user.id, resumeId.data);
  const bucket = supabase.storage.from(PHOTO_BUCKET);
  const upload = await bucket.upload(path, bytes, { contentType: "image/jpeg" });
  if (upload.error) {
    return PHOTO_FAILED;
  }
  const { error } = await supabase
    .from("resumes")
    .update({ photo_path: path })
    .eq("id", resumeId.data);
  if (error) {
    await bucket.remove([path]);
    return PHOTO_FAILED;
  }
  // The old file goes last, so a failure above never leaves the resume without its photo.
  if (resume.photo_path) {
    await bucket.remove([resume.photo_path]);
  }
  return { ok: true, photoPath: path };
}

export async function removeResumePhoto(id: string): Promise<PhotoResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, message: "Your session ended. Log in again." };
  }
  const resumeId = resumeIdSchema.safeParse(id);
  if (!resumeId.success) {
    return { ok: false, message: "Could not remove the photo. Try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("resumes")
    .update({ photo_path: null })
    .eq("id", resumeId.data);
  if (error) {
    return { ok: false, message: "Could not remove the photo. Try again." };
  }
  await removeResumePhotos(supabase, user.id, resumeId.data);
  return { ok: true, photoPath: null };
}
