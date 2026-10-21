import type { Metadata } from "next";
import Link from "next/link";

import { BrandHeader } from "@/components/brand-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader />
      <main className="mx-auto max-w-md flex-1 px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The link may be broken, or the page may have moved.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/" />}>
          Go to the home page
        </Button>
      </main>
    </div>
  );
}
