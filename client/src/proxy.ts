import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Optimistic check only. requireUser() and RLS are what actually protect data.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|txt)$).*)"],
};
