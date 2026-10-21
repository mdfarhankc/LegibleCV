import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ResumeEditor } from "@/components/editor/resume-editor";
import { toFormValues } from "@/lib/resumes/form";
import { getResume } from "@/lib/resumes/queries";

// The metadata and the page both need the resume; this keeps it to one query.
const loadResume = cache(getResume);

export async function generateMetadata({ params }: PageProps<"/editor/[id]">): Promise<Metadata> {
  const resume = await loadResume((await params).id);
  return { title: resume?.title || "Editor" };
}

export default async function EditorPage({ params }: PageProps<"/editor/[id]">) {
  const { id } = await params;
  const resume = await loadResume(id);
  if (!resume) {
    notFound();
  }

  return (
    // Keyed by id so opening another resume starts a fresh form.
    <ResumeEditor
      key={resume.id}
      resumeId={resume.id}
      initialValues={toFormValues(resume.title, resume.data, resume.photoPath)}
    />
  );
}
