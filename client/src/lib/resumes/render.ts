import "server-only";

import { getUser } from "@/lib/auth/dal";
import { env } from "@/lib/env";
import { loadPhoto, toDataUri } from "@/lib/resumes/photo";
import { toRenderPayload } from "@/lib/resumes/render-payload";
import { createClient } from "@/lib/supabase/server";
import type { Resume } from "@/types/resume";

export type RenderFormat = "preview" | "pdf" | "docx";

export type RenderFailure = {
  ok: false;
  status: number;
  message: string;
  // The service didn't answer, which is what a sleeping instance looks like. Worth retrying.
  unavailable: boolean;
};
export type RenderSuccess = { ok: true; response: Response };

function failureMessage(status: number): string {
  if (status === 401) {
    return "Your session ended. Log in again.";
  }
  if (status === 422) {
    return "Part of this resume can't be rendered yet. Check for very long or unusual values.";
  }
  if (status === 429) {
    return "Too many requests in a short time. Wait a few seconds and try again.";
  }
  if (status === 413) {
    return "This resume is too large to render.";
  }
  return "The resume couldn't be rendered. Try again in a moment.";
}

// Calls the render service as the signed-in user. The token stays on the server.
export async function renderResume(
  format: RenderFormat,
  resume: Resume,
  photoPath: string | null = null,
): Promise<RenderSuccess | RenderFailure> {
  const user = await getUser();
  const supabase = await createClient();
  // getSession() is only used to forward the token; the render service verifies it itself.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!user || !token) {
    return { ok: false, status: 401, message: failureMessage(401), unavailable: false };
  }

  // Only the two-column templates print a photo. The Word check covers a direct call:
  // those templates don't offer a Word file.
  const printsPhoto = format !== "docx" && resume.options?.template !== "classic";
  const photo = photoPath && printsPhoto ? await loadPhoto(supabase, user.id, photoPath) : null;

  let response: Response;
  try {
    response = await fetch(`${env.renderServiceUrl}/v1/render/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...toRenderPayload(resume),
        photo: photo ? toDataUri(photo) : null,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return {
      ok: false,
      status: 503,
      message: "The render service isn't reachable. Try again in a moment.",
      unavailable: true,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: failureMessage(response.status),
      // What a host answers with while the service is still starting.
      unavailable: [502, 503, 504].includes(response.status),
    };
  }
  return { ok: true, response };
}
