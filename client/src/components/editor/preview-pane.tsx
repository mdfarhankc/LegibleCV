"use client";

import { LoaderCircle } from "lucide-react";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { type PreviewResult, renderPreview } from "@/lib/resumes/actions";
import type { ResumeFormValues } from "@/lib/resumes/form";

const DELAY_MS = 1000;
// A sleeping render service can take a minute to start. The preview keeps asking meanwhile.
const SLOW_AFTER_MS = 4000;
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 6;
// CSS pixels at 96 per inch, matching the page the render service lays out.
const PAGE_PX = {
  A4: { width: 794, height: 1123 },
  Letter: { width: 816, height: 1056 },
} as const;
// Top and bottom page margin of the classic template (0.5in).
const PAGE_MARGIN_PX = 48;

export function PreviewPane() {
  const { control, getValues } = useFormContext<ResumeFormValues>();
  // Only used as a signal that something changed; the values are read when the timer fires.
  const watched = useWatch({ control });
  const pageSize = useWatch({ control, name: "page_size" });

  const [html, setHtml] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // The render service is taking long enough that it's probably starting up.
  const [starting, setStarting] = useState(false);
  const latestRequest = useRef(0);

  useEffect(() => {
    const request = ++latestRequest.current;
    let timer: ReturnType<typeof setTimeout>;
    let slowTimer: ReturnType<typeof setTimeout>;

    async function load(attempt: number) {
      setLoading(true);
      slowTimer = setTimeout(() => setStarting(true), SLOW_AFTER_MS);
      const result: PreviewResult = await renderPreview(getValues()).catch(() => ({
        ok: false,
        message: "The preview couldn't be loaded. Check your connection.",
      }));
      clearTimeout(slowTimer);
      // A newer change is already on its way; drop this answer.
      if (request !== latestRequest.current) {
        return;
      }
      if (!result.ok && result.unavailable && attempt < MAX_RETRIES) {
        setStarting(true);
        timer = setTimeout(() => void load(attempt + 1), RETRY_DELAY_MS);
        return;
      }
      setLoading(false);
      setStarting(false);
      if (result.ok) {
        setHtml(result.html);
        setPageCount(result.pageCount);
        setMessage(null);
      } else {
        // Keep the last good render on screen and say what went wrong.
        setMessage(result.message);
      }
    }

    timer = setTimeout(() => void load(0), DELAY_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(slowTimer);
    };
  }, [watched, getValues]);

  // The page is rendered at its real width and scaled down to fit the column.
  const column = useRef<HTMLDivElement>(null);
  const [columnWidth, setColumnWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = column.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => setColumnWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The frame is made as tall as the resume, so the page itself never scrolls inside the frame.
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentObserver = useRef<ResizeObserver | null>(null);
  useEffect(() => () => contentObserver.current?.disconnect(), []);

  function measure(event: SyntheticEvent<HTMLIFrameElement>) {
    const page = event.currentTarget.contentDocument;
    if (!page) {
      return;
    }
    const update = () => setContentHeight(page.documentElement.scrollHeight);
    update();
    // The height changes again once the font has loaded.
    contentObserver.current?.disconnect();
    contentObserver.current = new ResizeObserver(update);
    contentObserver.current.observe(page.body);
  }

  const page = PAGE_PX[pageSize];
  const pageWidth = page.width;
  const scale = columnWidth ? columnWidth / pageWidth : 1;

  // The preview is one continuous sheet, so the breaks are drawn on top of it. The count is
  // exact (it comes from the PDF layout). The positions assume each page is filled to the
  // bottom, so a break can sit a line or two lower than in the PDF.
  const printableHeight = page.height - 2 * PAGE_MARGIN_PX;
  const breaks = Array.from(
    { length: Math.max(0, (pageCount ?? 1) - 1) },
    (_, index) => (PAGE_MARGIN_PX + (index + 1) * printableHeight) * scale,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div
        className="flex min-h-7 shrink-0 items-center gap-2 text-sm text-muted-foreground"
        role="status"
      >
        {loading && (
          <>
            <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />
            {starting
              ? "Starting the preview service. This can take up to a minute."
              : "Updating preview..."}
          </>
        )}
        {!loading && message && <span className="text-destructive">{message}</span>}
        {!loading && !message && (pageCount ? `Preview, ${pageCount === 1 ? "1 page" : `${pageCount} pages`}` : "Preview")}
      </div>

      {/* The desk. Fills the rest of the column and scrolls when the resume is longer. */}
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-muted/60 p-4 [scrollbar-width:thin] sm:p-6">
        <div ref={column}>
          {html && columnWidth && (
            <div
              className="relative overflow-hidden rounded-[3px] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.08),0_12px_32px_-12px_rgb(0_0_0/0.3)] ring-1 ring-black/10"
              style={{ height: contentHeight ? contentHeight * scale : undefined }}
            >
              <iframe
                title="Resume preview"
                // No scripts can run in the frame. Same-origin is allowed only so its height
                // can be measured from here.
                sandbox="allow-same-origin"
                srcDoc={html}
                onLoad={measure}
                className="origin-top-left border-0"
                style={{
                  width: pageWidth,
                  height: contentHeight ?? page.height,
                  transform: `scale(${scale})`,
                }}
              />
              {breaks.map((top, index) => (
                <div
                  key={index}
                  className="pointer-events-none absolute inset-x-0 flex items-center gap-2 pr-2"
                  style={{ top }}
                >
                  <span className="h-0 flex-1 border-t border-dashed border-(--brand)/70" />
                  <span className="rounded-full bg-(--brand) px-2 py-0.5 text-xs font-medium text-white">
                    Page {index + 2} starts about here
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
