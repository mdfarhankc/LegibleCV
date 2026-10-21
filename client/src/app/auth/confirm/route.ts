import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth/redirect";
import {
  DEFAULT_SIGNED_IN_PATH,
  LOGIN_PATH,
  SETTINGS_PATH,
  UPDATE_PASSWORD_PATH,
} from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

// Email link types I handle, and where each one lands after verification.
const DESTINATIONS = {
  email: DEFAULT_SIGNED_IN_PATH,
  signup: DEFAULT_SIGNED_IN_PATH,
  recovery: UPDATE_PASSWORD_PATH,
  email_change: `${SETTINGS_PATH}?notice=email_change`,
} as const;

type LinkType = keyof typeof DESTINATIONS;

function isLinkType(value: string | null): value is LinkType {
  return value !== null && Object.hasOwn(DESTINATIONS, value);
}

// Target of the links in the confirmation, password reset, and email change emails.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (tokenHash && isLinkType(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const next = searchParams.get("next");
      redirect(next ? safeRedirectPath(next) : DESTINATIONS[type]);
    }
  }

  // Changing email needs a session, and /login would bounce a signed-in user to the dashboard
  // and lose the message.
  if (type === "email_change") {
    redirect(`${SETTINGS_PATH}?error=callback_failed`);
  }
  redirect(`${LOGIN_PATH}?error=link_invalid`);
}
