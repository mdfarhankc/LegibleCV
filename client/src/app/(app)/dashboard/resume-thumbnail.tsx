import type { PreviewRow, ResumePreview } from "@/lib/resumes/preview";

// Sizes are in cqw (percent of the thumbnail's width), so the page keeps its proportions
// whatever size the card is.

function PlaceholderLines() {
  return (
    <div className="grid gap-[1cqw] pt-[0.5cqw]">
      <div className="h-[1.2cqw] rounded-full bg-black/10" />
      <div className="h-[1.2cqw] w-2/3 rounded-full bg-black/10" />
    </div>
  );
}

function Row({ row }: { row: PreviewRow }) {
  if (row.style === "bullet") {
    return (
      <p className="truncate pl-[2.5cqw]">
        <span className="-ml-[2.5cqw] inline-block w-[2.5cqw]">&bull;</span>
        {row.text}
      </p>
    );
  }
  if (row.style === "plain") {
    return <p className="line-clamp-2">{row.text}</p>;
  }
  return (
    <p className="flex justify-between gap-[2cqw]">
      <span className={`truncate ${row.style === "bold" ? "font-bold" : "italic"}`}>{row.text}</span>
      {row.right && <span className="shrink-0">{row.right}</span>}
    </p>
  );
}

export function ResumeThumbnail({ preview }: { preview: ResumePreview }) {
  return (
    <div className="@container" aria-hidden="true">
      {/* Paper: white with black ink in both themes. */}
      <div className="aspect-[210/297] bg-white px-[7cqw] pt-[6.5cqw] font-(family-name:--font-resume) text-[2.35cqw] leading-[1.35] text-black">
        {preview.name ? (
          <p className="truncate text-center text-[5.2cqw] leading-tight font-bold">{preview.name}</p>
        ) : (
          <div className="mx-auto h-[4cqw] w-1/2 rounded-full bg-black/10" />
        )}
        <p className="mt-[0.6cqw] truncate text-center text-[2.1cqw]">{preview.contact}</p>

        {preview.sections.map((section, index) => (
          <div key={index}>
            <p className="mt-[2.4cqw] mb-[1cqw] truncate border-b border-black pb-[0.3cqw] text-[2.7cqw] font-bold">
              {section.title}
            </p>
            {section.rows.length > 0 ? (
              section.rows.map((row, rowIndex) => <Row key={rowIndex} row={row} />)
            ) : (
              <PlaceholderLines />
            )}
          </div>
        ))}
        {preview.sections.length === 0 && (
          <div className="mt-[4cqw]">
            <PlaceholderLines />
          </div>
        )}
      </div>
    </div>
  );
}
