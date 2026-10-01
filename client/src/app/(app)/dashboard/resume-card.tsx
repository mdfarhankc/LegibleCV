"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
};

export function ResumeCard({ id, title, editedLabel, preview }: ResumeCardProps) {
  const [dialog, setDialog] = useState<"rename" | "delete" | null>(null);

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow] duration-200 focus-within:border-primary hover:border-primary/60 hover:shadow-[0_18px_40px_-24px_rgb(0_0_0/0.5)]">
      {/* The page lies on a desk and runs off the bottom edge. */}
      <div className="h-60 overflow-hidden bg-muted/60 px-7 pt-7">
        <div className="rounded-t-[3px] shadow-[0_1px_2px_rgb(0_0_0/0.1),0_10px_24px_-10px_rgb(0_0_0/0.35)] ring-1 ring-black/10 transition-transform duration-300 ease-out motion-safe:group-hover:-translate-y-2">
          <ResumeThumbnail preview={preview} />
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
          <p className="mt-0.5 text-sm text-muted-foreground">{editedLabel}</p>
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
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setDialog("rename")}>
              <Pencil />
              Rename
            </DropdownMenuItem>
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
