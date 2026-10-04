export type DownloadFormat = "pdf" | "docx";

// A Word file can't hold the two-column layouts in a way that stays editable, so only the
// Classic template offers one.
export function canDownload(format: DownloadFormat, template: string): boolean {
  return format === "pdf" || template === "classic";
}
