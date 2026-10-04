"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// The uploaded photo is a square of this size.
const OUTPUT_PX = 400;
// The frame on screen, in CSS pixels.
const FRAME_PX = 280;
const MAX_ZOOM = 3;

type Point = { x: number; y: number };

// The part of the picture inside the frame, in the picture's own pixels.
function cropRect(bitmap: ImageBitmap, zoom: number, center: Point) {
  const side = Math.min(bitmap.width, bitmap.height) / zoom;
  return { left: center.x - side / 2, top: center.y - side / 2, side };
}

// Keeps the frame inside the picture.
function clampCenter(bitmap: ImageBitmap, zoom: number, center: Point): Point {
  const half = Math.min(bitmap.width, bitmap.height) / zoom / 2;
  return {
    x: Math.min(Math.max(center.x, half), bitmap.width - half),
    y: Math.min(Math.max(center.y, half), bitmap.height - half),
  };
}

function draw(canvas: HTMLCanvasElement, bitmap: ImageBitmap, zoom: number, center: Point) {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not available");
  }
  const { left, top, side } = cropRect(bitmap, zoom, center);
  context.drawImage(bitmap, left, top, side, side, 0, 0, canvas.width, canvas.height);
}

type PhotoCropDialogProps = {
  file: File;
  onCancel: () => void;
  // Called when the file can't be read as an image.
  onUnreadable: () => void;
  onSave: (photo: Blob) => void;
};

export function PhotoCropDialog({ file, onCancel, onUnreadable, onSave }: PhotoCropDialogProps) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<Point>({ x: 0, y: 0 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const lastPointer = useRef<Point | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loaded: ImageBitmap | null = null;
    createImageBitmap(file)
      .then((image) => {
        if (cancelled) {
          image.close();
          return;
        }
        loaded = image;
        const spare = image.height - Math.min(image.width, image.height);
        // Centered sideways. On a tall picture it starts near the top, where the face usually is.
        setCenter({ x: image.width / 2, y: image.height / 2 - spare * 0.3 });
        setBitmap(image);
      })
      .catch(() => {
        if (!cancelled) {
          onUnreadable();
        }
      });
    return () => {
      cancelled = true;
      loaded?.close();
    };
  }, [file, onUnreadable]);

  useEffect(() => {
    if (bitmap && canvas.current) {
      draw(canvas.current, bitmap, zoom, center);
    }
  }, [bitmap, zoom, center]);

  function moveBy(dx: number, dy: number) {
    if (!bitmap) {
      return;
    }
    // Screen pixels to picture pixels. Dragging right shows more of the picture's left.
    const scale = cropRect(bitmap, zoom, center).side / FRAME_PX;
    setCenter(clampCenter(bitmap, zoom, { x: center.x - dx * scale, y: center.y - dy * scale }));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPointer.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!lastPointer.current) {
      return;
    }
    moveBy(event.clientX - lastPointer.current.x, event.clientY - lastPointer.current.y);
    lastPointer.current = { x: event.clientX, y: event.clientY };
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = 12;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      moveBy(...move);
    }
  }

  function changeZoom(value: number) {
    setZoom(value);
    if (bitmap) {
      setCenter(clampCenter(bitmap, value, center));
    }
  }

  function save() {
    if (!bitmap) {
      return;
    }
    const output = document.createElement("canvas");
    output.width = OUTPUT_PX;
    output.height = OUTPUT_PX;
    draw(output, bitmap, zoom, center);
    output.toBlob((blob) => (blob ? onSave(blob) : onUnreadable()), "image/jpeg", 0.85);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Position your photo</DialogTitle>
          <DialogDescription>
            Drag to move it and use the slider to zoom. The Side panel template prints the circle,
            the Banner template the whole square.
          </DialogDescription>
        </DialogHeader>

        <div className="grid justify-items-center gap-4">
          <div
            role="application"
            aria-label="Photo position. Use the arrow keys to move it."
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (lastPointer.current = null)}
            onPointerCancel={() => (lastPointer.current = null)}
            onKeyDown={onKeyDown}
            style={{ width: FRAME_PX, height: FRAME_PX }}
            className="relative max-w-full cursor-grab touch-none overflow-hidden rounded-md bg-muted outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
          >
            <canvas
              ref={canvas}
              // Twice the frame, so it stays sharp on high-density screens.
              width={FRAME_PX * 2}
              height={FRAME_PX * 2}
              className="size-full"
            />
            {/* Dims everything outside the circle. */}
            <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgb(0_0_0/0.45)] ring-1 ring-white/70" />
          </div>

          <div className="grid w-full max-w-[280px] gap-2">
            <Label htmlFor="photo-zoom">Zoom</Label>
            <input
              id="photo-zoom"
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(event) => changeZoom(Number(event.target.value))}
              disabled={!bitmap}
              className="w-full accent-primary"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={!bitmap}>
            Save photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
