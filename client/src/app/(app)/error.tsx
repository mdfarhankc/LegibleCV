"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function AppError({ error, retry }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-heading text-2xl font-semibold">This page didn&apos;t load</h1>
      <p className="mt-2 text-muted-foreground">
        Something went wrong while loading your data. Your resumes are safe. Try again in a moment.
      </p>
      <Button className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
