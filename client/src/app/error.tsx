"use client";

import Link from "next/link";
import { useEffect } from "react";

import { BrandHeader } from "@/components/brand-header";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Whatever the app's own error page can't catch: the landing, sign-in and legal pages, and the
// app's layout itself.
export default function RootError({ error, retry }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader />
      <main className="mx-auto max-w-md flex-1 px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">
          This page didn&apos;t load. Try again in a moment.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => retry()}>Try again</Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Go to the home page
          </Button>
        </div>
      </main>
    </div>
  );
}
