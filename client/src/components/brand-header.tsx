import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { SITE } from "@/lib/site";

// The plain header for pages outside the app: sign-in and the legal pages.
export function BrandHeader() {
  return (
    <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5">
      <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
        {SITE.name}
      </Link>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
