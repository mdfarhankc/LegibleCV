import { notFound } from "next/navigation";

import { toFormValues, toResume } from "@/lib/resumes/form";
import { getResume } from "@/lib/resumes/queries";
import { renderResume } from "@/lib/resumes/render";

const FORMATS = ["pdf", "docx"] as const;
type Format = (typeof FORMATS)[number];

function isFormat(value: string): value is Format {
  return FORMATS.includes(value as Format);
}

// Download link target. Renders the saved resume, so the file matches what autosave stored.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/editor/[id]/export/[format]">,
) {
  const { id, format } = await params;
  if (!isFormat(format)) {
    notFound();
  }
  // getResume() checks the session, and RLS returns nothing for someone else's resume.
  const resume = await getResume(id);
  if (!resume) {
    notFound();
  }
  // The column is untyped jsonb, so normalize it the same way the editor does.
  const data = toResume(toFormValues(resume.title, resume.data));
  if (!data.full_name || !data.email) {
    return new Response("Add your name and email before downloading.", { status: 400 });
  }

  const result = await renderResume(format, data, resume.photoPath);
  if (!result.ok) {
    return new Response(result.message, { status: result.status });
  }

  const headers = new Headers({ "Cache-Control": "no-store" });
  for (const name of ["Content-Type", "Content-Disposition"]) {
    const value = result.response.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  return new Response(result.response.body, { headers });
}
