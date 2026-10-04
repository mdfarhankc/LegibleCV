import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ResumeEditor } from "@/components/editor/resume-editor";
import { toFormValues } from "@/lib/resumes/form";
import { getResume } from "@/lib/resumes/queries";

export const metadata: Metadata = { title: "Editor" };

export default async function EditorPage({ params }: PageProps<"/editor/[id]">) {
  const { id } = await params;
  const resume = await getResume(id);
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
