import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth/redirect";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

// Where Google and GitHub send the user back after they approve the sign-in.
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

  redirect(`${LOGIN_PATH}?error=oauth_failed`);
}
