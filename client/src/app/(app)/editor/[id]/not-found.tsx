import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth/routes";

export default function ResumeNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-heading text-2xl font-semibold">Resume not found</h1>
      <p className="mt-2 text-muted-foreground">
        It may have been deleted, or the link is wrong.
      </p>
      <Button
        className="mt-6"
        nativeButton={false}
        render={<Link href={DEFAULT_SIGNED_IN_PATH} />}
      >
        Back to your resumes
      </Button>
    </div>
  );
}
