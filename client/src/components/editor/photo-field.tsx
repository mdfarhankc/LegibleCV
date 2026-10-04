"use client";

import { User } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useRef, useState, useTransition } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { PhotoCropDialog } from "@/components/editor/photo-crop-dialog";
import { Button } from "@/components/ui/button";
import { removeResumePhoto, uploadResumePhoto } from "@/lib/resumes/actions";
import type { ResumeFormValues } from "@/lib/resumes/form";

// Phone cameras produce large files. Anything above this isn't worth decoding.
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const CONNECTION_ERROR = {
  ok: false as const,
  message: "That didn't go through. Check your connection and try again.",
};

export function PhotoField({ resumeId }: { resumeId: string }) {
  const { control, setValue } = useFormContext<ResumeFormValues>();
  const photoPath = useWatch({ control, name: "photo_path" });
  const template = useWatch({ control, name: "template" });
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  // The picture being positioned in the crop dialog.
  const [chosen, setChosen] = useState<File | null>(null);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared so picking the same file again still fires a change.
    event.target.value = "";
    if (!file) {
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setMessage("That file is too large. Use one under 20 MB.");
      return;
    }
    setMessage(null);
    setChosen(file);
  }

  function unreadable() {
    setChosen(null);
    setMessage("That file couldn't be read as an image. Use a JPEG, PNG, or WebP.");
  }

  // The dialog hands back a small square JPEG, so that's all that gets uploaded.
  function upload(photo: Blob) {
    setChosen(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("photo", photo, "photo.jpg");
      const result = await uploadResumePhoto(resumeId, formData).catch(() => CONNECTION_ERROR);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setValue("photo_path", result.photoPath, { shouldDirty: true });
    });
  }

  function remove() {
    startTransition(async () => {
      setMessage(null);
      const result = await removeResumePhoto(resumeId).catch(() => CONNECTION_ERROR);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setValue("photo_path", null, { shouldDirty: true });
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
        {photoPath ? (
          <Image
            // The address stays the same when the photo is replaced, so the key reloads it.
            key={photoPath}
            // Served by a route that needs the session, so the image optimizer can't fetch it.
            unoptimized
            src={`/editor/${resumeId}/photo`}
            alt="Your photo"
            width={64}
            height={64}
            className="size-full object-cover"
          />
        ) : (
          <User className="size-7" aria-hidden="true" />
        )}
      </div>

      <div className="grid min-w-0 gap-1.5">
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={choose}
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => input.current?.click()}
          >
            {pending ? "Working..." : photoPath ? "Replace photo" : "Add photo"}
          </Button>
          {photoPath && (
            <Button type="button" variant="ghost" disabled={pending} onClick={remove}>
              Remove
            </Button>
          )}
        </div>
        {message ? (
          <p className="text-sm text-destructive" role="alert">
            {message}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {photoPath && template === "classic"
              ? "The Classic template doesn't print a photo. Pick Side panel or Banner to show it."
              : "Optional. Shown on the Side panel and Banner templates."}
          </p>
        )}
      </div>

      {chosen && (
        <PhotoCropDialog
          file={chosen}
          onCancel={() => setChosen(null)}
          onUnreadable={unreadable}
          onSave={upload}
        />
      )}
    </div>
  );
}
