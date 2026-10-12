import type { DownloadFormat } from "@/lib/resumes/formats";

// I fetch the file with script instead of a plain link, so the page can show progress and say
// what went wrong. A PDF takes a few seconds, longer when the render service was asleep.

// A sleeping render service doesn't answer the first request. Each try waits up to 20 seconds.
const ATTEMPTS = 3;
const STARTING_UP = [502, 503, 504];
const FAILED = "The file couldn't be made. Try again in a moment.";

function save(file: Blob, name: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Released after the browser has had time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// Returns null when the download started, or a message to show.
export async function downloadResume(
  resumeId: string,
  format: DownloadFormat,
): Promise<string | null> {
  let response: Response | null = null;
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    try {
      response = await fetch(`/editor/${resumeId}/export/${format}`);
    } catch {
      return "That didn't go through. Check your connection and try again.";
    }
    if (!STARTING_UP.includes(response.status)) {
      break;
    }
  }
  if (!response) {
    return FAILED;
  }

  if (!response.ok) {
    // The export route explains failures in a short line of plain text.
    const plain = response.headers.get("Content-Type")?.startsWith("text/plain");
    return (plain && (await response.text()).slice(0, 200)) || FAILED;
  }
  const disposition = response.headers.get("Content-Disposition");
  if (!disposition) {
    // Not a file: a signed-out request is sent to the login page instead.
    return "Your session ended. Log in again.";
  }

  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `Resume.${format}`;
  save(await response.blob(), name);
  return null;
}
