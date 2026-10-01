"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/dal";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";
import type { FormState } from "@/lib/form-state";
import { DEFAULT_RESUME_TITLE, newResumeData } from "@/lib/resumes/defaults";
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
  await requireUser();

  const id = resumeIdSchema.safeParse(formData.get("id"));
  if (!id.success) {
    return { message: "Could not delete the resume. Try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("resumes").delete().eq("id", id.data);
  if (error) {
    return { message: "Could not delete the resume. Try again." };
  }

  revalidatePath(DEFAULT_SIGNED_IN_PATH);
  return { success: "Deleted." };
}
