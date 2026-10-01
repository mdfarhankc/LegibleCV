import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_SIGNED_IN_PATH,
  isGuestOnlyPath,
  isProtectedPath,
  LOGIN_PATH,
} from "@/lib/auth/routes";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // No-cache headers, so a CDN never stores a response that sets someone's session.
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  // Refreshes the session if it expired. Must run before any redirect decision.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;

  if (!isSignedIn && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectKeepingSession(loginUrl, response);
  }

  if (isSignedIn && isGuestOnlyPath(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = DEFAULT_SIGNED_IN_PATH;
    homeUrl.search = "";
    return redirectKeepingSession(homeUrl, response);
  }

  return response;
}

// A redirect is a new response, so refreshed cookies and their headers have to be carried over.
function redirectKeepingSession(url: URL, source: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  const cacheControl = source.headers.get("Cache-Control");
  if (cacheControl) {
    redirect.headers.set("Cache-Control", cacheControl);
  }
  return redirect;
}
