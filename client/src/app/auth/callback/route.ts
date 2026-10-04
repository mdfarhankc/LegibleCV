import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth/redirect";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

// Where the user comes back to with a one-time code: after approving a Google or GitHub
// sign-in, and after opening a link in a confirmation, password reset, or email change email.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(safeRedirectPath(searchParams.get("next")));
    }
  }

  // Supabase reports a used or expired email link with an error_code instead of a code.
  const reason = searchParams.has("error_code") ? "link_invalid" : "oauth_failed";
  redirect(`${LOGIN_PATH}?error=${reason}`);
}
