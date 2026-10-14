import "server-only";

import { requireUser } from "@/lib/auth/dal";
import {
  buildResumePreview,
  canExportResume,
  parseStoredResume,
  type ResumePreview,
} from "@/lib/resumes/preview";
import { resumeIdSchema } from "@/lib/resumes/schemas";
import { createClient } from "@/lib/supabase/server";
import type { Resume } from "@/types/resume";

export type ResumeSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type ResumeListItem = ResumeSummary & {
  preview: ResumePreview;
  // Null when there's no photo, or the template doesn't print one.
  photoUrl: string | null;
  canExport: boolean;
};

export type StoredResume = ResumeSummary & {
  data: Resume;
  photoPath: string | null;
};

// RLS limits every query here to the signed-in user's rows.

export async function listResumes(): Promise<ResumeListItem[]> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, updated_at, data, photo_path")
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error("Could not load resumes", { cause: error });
  }
  // Only the small preview leaves the server, not the whole resume.
  return data.map((row) => {
    const stored = parseStoredResume(row.data);
    const preview = buildResumePreview(stored);
    return {
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at,
      preview,
      photoUrl:
        row.photo_path && preview.template !== "classic" ? `/editor/${row.id}/photo` : null,
      canExport: canExportResume(stored),
    };
  });
}

// Null when the id is malformed, the resume doesn't exist, or it belongs to someone else.
export async function getResume(id: string): Promise<StoredResume | null> {
  await requireUser();
  if (!resumeIdSchema.safeParse(id).success) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, updated_at, data, photo_path")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error("Could not load the resume", { cause: error });
  }
  if (!data) {
    return null;
  }
  return {
    id: data.id,
    title: data.title,
    updatedAt: data.updated_at,
    // jsonb comes back untyped. The editor validates the shape before using it.
    data: data.data as unknown as Resume,
    photoPath: data.photo_path,
  };
}

// Only the photo path, for the photo route. Null for no photo, a bad id, or someone else's resume.
export async function getResumePhotoPath(id: string): Promise<string | null> {
  await requireUser();
  if (!resumeIdSchema.safeParse(id).success) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("photo_path")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error("Could not load the photo", { cause: error });
  }
  return data?.photo_path ?? null;
}

// Null means unlimited.
export async function getResumeLimit(): Promise<number | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("max_resumes")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) {
    throw new Error("Could not load the resume limit", { cause: error });
  }
  return data.max_resumes;
}
