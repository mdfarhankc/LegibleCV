import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";
import { getResume } from "@/lib/resumes/queries";

export const metadata: Metadata = { title: "Editor" };

export default async function EditorPage({ params }: PageProps<"/editor/[id]">) {
  const { id } = await params;
  const resume = await getResume(id);
  if (!resume) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <Link
        href={DEFAULT_SIGNED_IN_PATH}
        className="flex items-center gap-2 justify-self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Your resumes
      </Link>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">{resume.title}</h1>
    </div>
  );
}
