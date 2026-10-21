"use client";

import { Copy, Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { duplicateResume } from "@/lib/resumes/actions";
import { downloadResume } from "@/lib/resumes/download";
import { canDownload, DOWNLOAD_FORMATS, type DownloadFormat } from "@/lib/resumes/formats";
import type { ResumePreview } from "@/lib/resumes/preview";

import { DeleteDialog } from "./delete-dialog";
import { RenameDialog } from "./rename-dialog";
import { ResumeThumbnail } from "./resume-thumbnail";

type ResumeCardProps = {
  id: string;
  title: string;
  // Formatted on the server, so server and client render the same text.
  editedLabel: string;
  preview: ResumePreview;
  // False once the account is at its resume limit.
  canDuplicate: boolean;
  // False until the resume has a name and an email.
  canExport: boolean;
  photoUrl: string | null;
};

const DOWNLOAD_LABELS: Record<DownloadFormat, string> = { pdf: "PDF", docx: "DOCX" };

export function ResumeCard({
  id,
  title,
  editedLabel,
  preview,
  canDuplicate,
  canExport,
  photoUrl,
}: ResumeCardProps) {
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);
  const downloads = DOWNLOAD_FORMATS.filter((format) => canDownload(format, preview.template));
  const [duplicating, startDuplicate] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState<string | null>(null);

  async function download(format: DownloadFormat, label: string) {
    setError(null);
    setPreparing(label);
    setError(await downloadResume(id, format));
    setPreparing(null);
  }

  function duplicate() {
    setError(null);
    startDuplicate(async () => {
      const result = await duplicateResume(id);
      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow] duration-200 focus-within:border-primary hover:border-primary/60 hover:shadow-[0_18px_40px_-24px_rgb(0_0_0/0.5)]">
      {/* The page lies on a desk and runs off the bottom edge. */}
      <div className="h-60 overflow-hidden bg-muted/60 px-7 pt-7">
        <div className="rounded-t-[3px] shadow-[0_1px_2px_rgb(0_0_0/0.1),0_10px_24px_-10px_rgb(0_0_0/0.35)] ring-1 ring-black/10 transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-2">
          <ResumeThumbnail preview={preview} photoUrl={photoUrl} />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t p-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium" title={title}>
            {/* The link covers the whole card; the menu button sits above it. */}
            <Link href={`/editor/${id}`} className="outline-none after:absolute after:inset-0">
              {title}
            </Link>
          </h2>
          {error ? (
            <p role="alert" className="relative z-10 mt-0.5 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {duplicating
                ? "Duplicating..."
                : preparing
                  ? `Preparing ${preparing}...`
                  : editedLabel}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative z-10 -mr-1"
                aria-label={`Actions for ${title}`}
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setDialog("rename")}>
              <Pencil />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!canDuplicate || duplicating} onClick={duplicate}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canExport ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download />
                  Download
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-32">
                  {downloads.map((format) => (
                    <DropdownMenuItem
                      key={format}
                      disabled={preparing !== null}
                      onClick={() => void download(format, DOWNLOAD_LABELS[format])}
                    >
                      {DOWNLOAD_LABELS[format]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : (
              // The files need a name and an email on the resume.
              <DropdownMenuItem disabled title="Add a name and email to the resume first.">
                <Download />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Keyed by title so the field starts from the saved name each time it opens. */}
      <RenameDialog
        key={title}
        id={id}
        title={title}
        open={dialog === "rename"}
        onOpenChange={(open) => setDialog(open ? "rename" : null)}
      />
      <DeleteDialog
        id={id}
        title={title}
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
      />
    </li>
  );
}
