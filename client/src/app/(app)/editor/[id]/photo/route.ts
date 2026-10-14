import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/dal";
import { loadPhoto } from "@/lib/resumes/photo";
import { getResumePhotoPath } from "@/lib/resumes/queries";
import { createClient } from "@/lib/supabase/server";

// The resume's photo, for the thumbnail in the editor. The bucket is private, so it's served
// from here with the user's session instead of a public link.
export async function GET(_request: Request, { params }: RouteContext<"/editor/[id]/photo">) {
  const { id } = await params;
  const user = await requireUser();
  const photoPath = await getResumePhotoPath(id);
  if (!photoPath) {
    notFound();
  }

  const photo = await loadPhoto(await createClient(), user.id, photoPath);
  if (!photo) {
    notFound();
  }
  return new Response(new Uint8Array(photo), {
    // The address doesn't change when the photo is replaced, so the browser must ask each time.
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-cache" },
  });
}
