import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-5">
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
          MakeMyResume
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
