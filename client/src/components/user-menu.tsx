"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth/actions";
import { SETTINGS_PATH } from "@/lib/auth/routes";

type UserMenuProps = {
  email: string;
  name: string;
  avatarUrl: string;
};

export function UserMenu({ email, name, avatarUrl }: UserMenuProps) {
  const [loggingOut, startLogout] = useTransition();
  const initial = (name || email).charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar>
          {/* no-referrer: Google's image host rejects requests that carry a referrer. */}
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />}
          <AvatarFallback className="font-medium text-foreground">{initial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
          <div className="px-1.5 pb-1.5 text-sm">
            {name && <p className="truncate font-medium">{name}</p>}
            <p className={name ? "truncate text-muted-foreground" : "truncate font-medium"} title={email}>
              {email}
            </p>
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={SETTINGS_PATH} />}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem disabled={loggingOut} onClick={() => startLogout(() => logout())}>
          <LogOut />
          {loggingOut ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
