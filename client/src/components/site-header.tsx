import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import type { AuthUser } from "@/lib/auth/dal";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";

export function SiteHeader({ user }: { user: AuthUser }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href={DEFAULT_SIGNED_IN_PATH} className="font-heading font-semibold tracking-tight">
          MakeMyResume
        </Link>
        {/* The logo already goes to the dashboard, so the link is dropped on a phone. */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href={DEFAULT_SIGNED_IN_PATH} />}
          >
            Dashboard
          </Button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserMenu
            email={user.email}
            name={user.profile.fullName}
            avatarUrl={user.profile.avatarUrl}
          />
        </div>
      </div>
    </header>
  );
}
