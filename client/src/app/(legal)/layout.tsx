import Link from "next/link";

import { BrandHeader } from "@/components/brand-header";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/site";

// Long-form text pages. The child selectors style plain headings, paragraphs and lists, so the
// pages themselves stay readable as text.
const prose =
  "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight " +
  "[&_p]:mb-4 [&_p]:leading-7 [&_p]:text-muted-foreground " +
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:leading-7 [&_li]:text-muted-foreground " +
  "[&_strong]:font-medium [&_strong]:text-foreground " +
  "[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4";

export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <article className={prose}>{children}</article>
      </main>

      <footer className="border-t">
        <nav className="mx-auto flex w-full max-w-3xl flex-wrap gap-6 px-5 py-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href={PRIVACY_PATH} className="hover:text-foreground">
            Privacy
          </Link>
          <Link href={TERMS_PATH} className="hover:text-foreground">
            Terms
          </Link>
        </nav>
      </footer>
    </div>
  );
}
