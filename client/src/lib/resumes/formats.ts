export const DOWNLOAD_FORMATS = ["pdf", "docx"] as const;

export type DownloadFormat = (typeof DOWNLOAD_FORMATS)[number];

export function isDownloadFormat(value: string): value is DownloadFormat {
  return (DOWNLOAD_FORMATS as readonly string[]).includes(value);
}

// A Word file can't hold the two-column layouts in a way that stays editable, so only the
// Classic template offers one.
export function canDownload(format: DownloadFormat, template: string): boolean {
  return format === "pdf" || template === "classic";
}
