import type { Metadata } from "next";

import { bannerFont, resumeFont } from "@/app/fonts";
import { getResumeLimit, listResumes } from "@/lib/resumes/queries";

import { NewResumeButton } from "./new-resume-button";
import { ResumeCard } from "./resume-card";

export const metadata: Metadata = { title: "Dashboard" };

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

function usageLabel(count: number, limit: number | null): string {
  if (limit === null) {
    return count === 1 ? "1 resume" : `${count} resumes`;
  }
  return `${count} of ${limit} resumes`;
}

export default async function DashboardPage() {
  const [resumes, limit] = await Promise.all([listResumes(), getResumeLimit()]);
  const atLimit = limit !== null && resumes.length >= limit;

  return (
    <div className={`${resumeFont.variable} ${bannerFont.variable} mx-auto grid w-full max-w-6xl content-start gap-8 px-4 py-8`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Your resumes</h1>
          <p className="text-muted-foreground">
            {usageLabel(resumes.length, limit)}
            {atLimit && ". Delete one to create another."}
          </p>
        </div>
        <NewResumeButton atLimit={atLimit} />
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <h2 className="font-heading text-xl font-semibold">No resumes yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
            Create your first one. It starts with the details from your profile already filled in.
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <ResumeCard
              key={resume.id}
              id={resume.id}
              title={resume.title}
              editedLabel={`Edited ${dateFormat.format(new Date(resume.updatedAt))}`}
              preview={resume.preview}
              canDuplicate={!atLimit}
              canExport={resume.canExport}
              photoUrl={resume.photoUrl}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
