import { ArrowRight, Check, FileText, FileType, X } from "lucide-react";
import Link from "next/link";

import { resumeFont } from "@/app/fonts";
import { AtsDemo } from "@/components/landing/ats-demo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/dal";
import { DEFAULT_SIGNED_IN_PATH, LOGIN_PATH, SIGNUP_PATH } from "@/lib/auth/routes";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/site";

const HERO_FACTS = ["Selectable text", "One-column layout", "PDF and Word"];

const FILTER_REASONS = [
  {
    problem: "The text is really a picture",
    detail:
      "Some design tools export an image of your resume. To a parser that is a blank page, however good it looks.",
    answer: "Every character in the PDF is real text you can select, search, and copy.",
  },
  {
    problem: "Columns get read in the wrong order",
    detail:
      "Two-column layouts and tables are often read straight across, mixing your job titles into your skills.",
    answer: "One column, top to bottom. The reading order is the order you wrote it in.",
  },
  {
    problem: "Links hide behind labels",
    detail:
      "A link that says “LinkedIn” can lose its address when the file is converted to plain text.",
    answer: "ATS mode prints the address itself, so your profile survives the conversion.",
  },
];

const STEPS = [
  {
    title: "Fill in your sections",
    body: "Experience, projects, education, skills, or sections you name yourself. Put them in any order.",
  },
  {
    title: "Check the preview",
    body: "The preview is rendered by the same engine as the download, so there are no surprises in the file.",
  },
  {
    title: "Download the file",
    body: "A PDF for applications, a Word document when someone asks for one. Both come from the same resume.",
  },
];

const FILES = [
  {
    icon: FileText,
    name: "PDF",
    purpose: "For job portals and email.",
    points: [
      "Selectable, searchable text",
      "Fonts embedded in the file",
      "Working links to your profiles",
      "ATS mode: black text, link addresses printed",
    ],
  },
  {
    icon: FileType,
    name: "Word document",
    purpose: "For recruiters who ask for a .docx, or a last change by hand.",
    points: [
      "Real headings and bullet lists",
      "Right-aligned dates that stay aligned",
      "Opens in Word, Google Docs, and LibreOffice",
      "Same content, same order as the PDF",
    ],
  },
];

const sectionClass = "mx-auto w-full max-w-6xl px-5 py-24";
const sectionTitleClass =
  "max-w-2xl font-heading text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-[2.75rem]";
const ctaClass = "h-12 px-6 text-base";
const arrowClass =
  "transition-transform duration-200 motion-safe:group-hover/button:translate-x-1";

export default async function HomePage() {
  const signedIn = (await getUser()) !== null;
  // One main action everywhere on the page: start for visitors, continue for signed-in users.
  const cta = signedIn
    ? { href: DEFAULT_SIGNED_IN_PATH, label: "Dashboard" }
    : { href: SIGNUP_PATH, label: "Create your resume" };

  return (
    <div className={`${resumeFont.variable} flex flex-1 flex-col`}>
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-5">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
            MakeMyResume
          </Link>
          <div className="ml-auto flex items-center gap-1">
            {!signedIn && (
              <Button variant="ghost" nativeButton={false} render={<Link href={LOGIN_PATH} />}>
                Log in
              </Button>
            )}
            <Button
              className={signedIn ? undefined : "hidden sm:inline-flex"}
              nativeButton={false}
              render={<Link href={cta.href} />}
            >
              {cta.label}
              <ArrowRight className={arrowClass} aria-hidden="true" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Soft brand light behind the document. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-24 right-[-10%] size-[36rem] rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pt-12 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,31rem)] lg:gap-16 lg:pt-20 lg:pb-28">
            <div className="min-w-0">
              <h1 className="font-heading text-[2.75rem] leading-[1] font-semibold tracking-[-0.03em] text-balance sm:text-6xl lg:text-[4.25rem]">
                Software reads your resume first. Make sure it can.
              </h1>
              <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-muted-foreground sm:text-xl sm:leading-relaxed">
                Most applications pass through an applicant tracking system before a person opens
                them. MakeMyResume gives you a PDF built for that step, and a Word file you can
                still edit by hand.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className={ctaClass}
                  nativeButton={false}
                  render={<Link href={cta.href} />}
                >
                  {cta.label}
                  <ArrowRight className={arrowClass} aria-hidden="true" />
                </Button>
                {!signedIn && (
                  <Button
                    size="lg"
                    variant="outline"
                    className={ctaClass}
                    nativeButton={false}
                    render={<Link href={LOGIN_PATH} />}
                  >
                    Log in
                  </Button>
                )}
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {HERO_FACTS.map((fact) => (
                  <li key={fact} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" aria-hidden="true" />
                    {fact}
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 motion-safe:animate-in motion-safe:duration-700 motion-safe:ease-out motion-safe:fade-in motion-safe:slide-in-from-bottom-6">
              <AtsDemo />
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className={sectionClass}>
            <h2 className={sectionTitleClass}>Why a good resume gets filtered out</h2>
            <p className="mt-5 max-w-[38rem] text-lg text-muted-foreground">
              It is rarely the content. It is usually the file. These are the three problems this
              app is built to avoid.
            </p>

            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border bg-border">
              {FILTER_REASONS.map(({ problem, detail, answer }) => (
                <div key={problem} className="grid gap-px bg-border md:grid-cols-2">
                  <div className="flex gap-4 bg-background p-6 sm:p-8">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <X className="size-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-medium">{problem}</h3>
                      <p className="mt-1.5 max-w-[30rem] text-muted-foreground">{detail}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 bg-background p-6 sm:p-8">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    <p className="max-w-[30rem] md:text-lg">{answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className={sectionClass}>
            <h2 className={sectionTitleClass}>Three steps, one resume</h2>
            <div className="relative mt-14">
              {/* Line joining the three numbers. */}
              <div
                aria-hidden="true"
                className="absolute top-6 right-1/3 left-6 hidden h-px bg-border md:block"
              />
              <ol className="relative grid gap-12 md:grid-cols-3 md:gap-10">
                {STEPS.map(({ title, body }, index) => (
                  <li key={title}>
                    <span className="flex size-12 items-center justify-center rounded-full border bg-background font-heading text-xl font-semibold text-primary tabular-nums">
                      {index + 1}
                    </span>
                    <h3 className="mt-5 text-lg font-medium">{title}</h3>
                    <p className="mt-1.5 max-w-[30rem] text-muted-foreground">{body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className={sectionClass}>
            <h2 className={sectionTitleClass}>Two files from one resume</h2>
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {FILES.map(({ icon: Icon, name, purpose, points }) => (
                <article key={name} className="rounded-2xl border p-7 sm:p-9">
                  <Icon className="size-7 text-primary" aria-hidden="true" />
                  <h3 className="mt-5 font-heading text-2xl font-semibold tracking-tight">
                    {name}
                  </h3>
                  <p className="mt-1.5 text-muted-foreground">{purpose}</p>
                  <ul className="mt-6 grid gap-3 border-t pt-6">
                    {points.map((point) => (
                      <li key={point} className="flex gap-3">
                        <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-24">
          <div className="flex flex-col items-start gap-6 rounded-3xl bg-(--brand) px-7 py-14 text-white sm:px-14 sm:py-20">
            <h2 className="max-w-2xl font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
              Write it once. Send it anywhere.
            </h2>
            <p className="max-w-[34rem] text-lg text-white/80">
              Early access is free and includes two resumes per account. No card needed.
            </p>
            <Button
              size="lg"
              className={`${ctaClass} bg-white text-(--brand) hover:bg-white/90`}
              nativeButton={false}
              render={<Link href={cta.href} />}
            >
              {cta.label}
              <ArrowRight className={arrowClass} aria-hidden="true" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-8 text-sm text-muted-foreground">
          <span className="font-heading text-base font-semibold text-foreground">MakeMyResume</span>
          <span>Resumes that software can read.</span>
          <nav className="flex flex-wrap gap-6 sm:ml-auto">
            <Link href={PRIVACY_PATH} className="hover:text-foreground">
              Privacy
            </Link>
            <Link href={TERMS_PATH} className="hover:text-foreground">
              Terms
            </Link>
            {signedIn ? (
              <Link href={DEFAULT_SIGNED_IN_PATH} className="hover:text-foreground">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href={LOGIN_PATH} className="hover:text-foreground">
                  Log in
                </Link>
                <Link href={SIGNUP_PATH} className="hover:text-foreground">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
