"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

const iconClass = "transition-all duration-300 ease-out motion-reduce:transition-none";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Both icons are always rendered; the .dark class decides which one is visible. */}
      <Sun className={`${iconClass} scale-100 rotate-0 dark:scale-0 dark:-rotate-90`} />
      <Moon className={`${iconClass} absolute scale-0 rotate-90 dark:scale-100 dark:rotate-0`} />
    </Button>
  );
}
