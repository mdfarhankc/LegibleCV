import "server-only";

import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const PHOTO_BUCKET = "resume-photos";
// Same cap as the bucket and the render service.
export const PHOTO_MAX_BYTES = 300 * 1024;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
// <user id>/<resume id>/<file id>.jpg
const PHOTO_PATH = new RegExp(`^(${UUID})/${UUID}/${UUID}\\.jpg$`);

// A new name for every upload, so a path always means the same image.
export function newPhotoPath(userId: string, resumeId: string): string {
  return `${userId}/${resumeId}/${crypto.randomUUID()}.jpg`;
}

// Storage policies enforce this too. Checking here keeps a bad path from reaching storage at all.
export function isOwnPhotoPath(path: string, userId: string): boolean {
  return PHOTO_PATH.exec(path)?.[1] === userId;
}

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export function toDataUri(photo: Buffer): string {
  return `data:image/jpeg;base64,${photo.toString("base64")}`;
}

// The preview re-renders on every pause in typing, and the photo is the same each time.
const CACHE_SIZE = 20;
const cache = new Map<string, Buffer>();

// Null when the path isn't the user's, the file is gone, or it isn't a usable JPEG.
export async function loadPhoto(
  supabase: Supabase,
  userId: string,
  path: string,
): Promise<Buffer | null> {
  if (!isOwnPhotoPath(path, userId)) {
    return null;
  }
  const cached = cache.get(path);
  if (cached) {
    return cached;
  }

  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(path);
  if (error || !data) {
    return null;
  }
  const photo = Buffer.from(await data.arrayBuffer());
  if (photo.length > PHOTO_MAX_BYTES || !isJpeg(photo)) {
    return null;
  }

  if (cache.size >= CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(path, photo);
  return photo;
}

async function listFiles(supabase: Supabase, folder: string): Promise<string[]> {
  const { data } = await supabase.storage.from(PHOTO_BUCKET).list(folder, { limit: 1000 });
  return (data ?? []).map((item) => `${folder}/${item.name}`);
}

// Removes everything in the resume's folder, including files a failed upload left behind.
export async function removeResumePhotos(
  supabase: Supabase,
  userId: string,
  resumeId: string,
): Promise<void> {
  const files = await listFiles(supabase, `${userId}/${resumeId}`);
  if (files.length > 0) {
    await supabase.storage.from(PHOTO_BUCKET).remove(files);
  }
}

// Supabase refuses to delete a user who still owns stored files.
export async function removeAllPhotos(supabase: Supabase, userId: string): Promise<boolean> {
  const folders = await listFiles(supabase, userId);
  const files = (await Promise.all(folders.map((folder) => listFiles(supabase, folder)))).flat();
  if (files.length === 0) {
    return true;
  }
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(files);
  return !error;
}
