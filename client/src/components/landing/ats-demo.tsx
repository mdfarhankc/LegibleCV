"use client";

import { FileText } from "lucide-react";
import type { ReactNode } from "react";

import { DesignedResume, Sheet } from "@/components/resume-paper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const captionClass = "px-1 pt-5 pb-1 text-sm text-muted-foreground";

function Found({ children }: { children: ReactNode }) {
  return <mark className="rounded-[2px] bg-mark px-0.5 text-black">{children}</mark>;
}

function ExtractedText() {
  return (
    <pre className="px-5 py-6 font-mono text-[10.5px] leading-[1.75] break-words whitespace-pre-wrap sm:px-7">
      <Found>ALEX MORGAN</Found>
      {"\n"}Springfield, IL, US | <Found>alex.morgan@example.com</Found> |{" "}
      <Found>+1-555-0100</Found>
      {"\n"}https://www.linkedin.com/in/alex-morgan-example
      {"\n\n"}PROFESSIONAL SUMMARY
      {"\n"}Python developer with 3+ years of experience building web applications with FastAPI
      and Django.
      {"\n\n"}WORK EXPERIENCE
      {"\n"}
      <Found>NORTHWIND SYSTEMS LLC</Found> Springfield, IL | Remote
      {"\n"}
      <Found>Python Developer</Found> <Found>MAR 2023 - Present</Found>
      {"\n"}• Designed and implemented RESTful APIs using <Found>FastAPI</Found> and{" "}
      <Found>Django</Found> for enterprise clients.
      {"\n"}• Optimized <Found>PostgreSQL</Found> schemas, indexes, and queries to cut response
      times.
      {"\n"}• Containerized services with <Found>Docker</Found> and automated deployments.
      {"\n\n"}
      <Found>Contoso Learning Labs</Found> Shelbyville, IL, US
      {"\n"}
      <Found>Python Developer Intern</Found> <Found>JUNE 2022 - JAN 2023</Found>
      {"\n"}• Built and maintained REST APIs with <Found>Django REST Framework</Found>.
      {"\n\n"}SKILLS
      {"\n"}Backend: Python (FastAPI, Django, Flask)
    </pre>
  );
}

export function AtsDemo() {
  return (
    <Tabs defaultValue="designed" className="min-w-0 gap-4">
      <div className="rounded-2xl border bg-muted/40 p-3 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.45)] sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 sm:pb-4">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4" aria-hidden="true" />
            resume.pdf
          </span>
          <TabsList>
            <TabsTrigger value="designed" className="px-3">
              What you see
            </TabsTrigger>
            <TabsTrigger value="extracted" className="px-3">
              What the software reads
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="designed">
          <Sheet>
            <DesignedResume />
          </Sheet>
          <p className={captionClass}>One column, real text, standard section headings.</p>
        </TabsContent>
        <TabsContent value="extracted">
          <Sheet>
            <ExtractedText />
          </Sheet>
          <p className={captionClass}>
            The same file as plain text, in the same order. Highlighted: what a parser picks out.
          </p>
        </TabsContent>
      </div>
    </Tabs>
  );
}
