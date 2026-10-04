import Image from "next/image";
import type { CSSProperties } from "react";

import { paletteFor, type TwoColumnTemplate } from "@/lib/resumes/colors";
import type { PreviewRow, PreviewSection, ResumePreview } from "@/lib/resumes/preview";

// Sizes are in cqw (percent of the thumbnail's width), so the page keeps its proportions
// whatever size the card is.

// Paper: white with black ink in both themes.
const paper = "aspect-[210/297] bg-white text-black";

type Look = {
  heading: string;
  // The second line of an entry: role, and location on the two-column templates.
  subtitle: string;
  label: string;
};

const CLASSIC: Look = {
  heading:
    "mt-[2.4cqw] mb-[1cqw] truncate border-b border-black pb-[0.3cqw] text-[2.7cqw] font-bold uppercase",
  subtitle: "italic",
  label: "font-bold",
};

const SIDE_PANEL: Look = {
  heading:
    "mt-[2.6cqw] mb-[1.2cqw] truncate border-b border-black/20 pb-[0.5cqw] text-[2.9cqw] leading-tight",
  subtitle: "text-(--accent)",
  label: "text-black/55",
};

const BANNER: Look = {
  heading: "mt-[2.6cqw] mb-[1.2cqw] truncate text-[3.1cqw] leading-tight font-light",
  subtitle: "text-black/55",
  label: "text-black/55",
};

function PlaceholderLines() {
  return (
    <div className="grid gap-[1cqw] pt-[0.5cqw]">
      <div className="h-[1.2cqw] rounded-full bg-black/10" />
      <div className="h-[1.2cqw] w-2/3 rounded-full bg-black/10" />
    </div>
  );
}

function Row({ row, look, stacked }: { row: PreviewRow; look: Look; stacked: boolean }) {
  if (row.style === "bullet") {
    return (
      <p className="truncate pl-[2.5cqw]">
        <span className="-ml-[2.5cqw] inline-block w-[2.5cqw]">&bull;</span>
        {row.text}
      </p>
    );
  }
  if (row.label && stacked) {
    return (
      <div className="mb-[0.8cqw]">
        <p className={`truncate ${look.label}`}>{row.label}</p>
        <p className="line-clamp-2">{row.text}</p>
      </div>
    );
  }
  if (row.style === "plain") {
    return (
      <p className="line-clamp-2">
        {row.label && <span className="font-bold">{row.label}: </span>}
        {row.text}
      </p>
    );
  }
  return (
    <p className="flex justify-between gap-[2cqw]">
      <span className={`truncate ${row.style === "bold" ? "font-bold" : look.subtitle}`}>
        {row.text}
      </span>
      {row.right && <span className="shrink-0">{row.right}</span>}
    </p>
  );
}

type SectionsProps = {
  sections: PreviewSection[];
  look: Look;
  stacked?: boolean;
};

function Sections({ sections, look, stacked = false }: SectionsProps) {
  return sections.map((section, index) => (
    <div key={index}>
      <p className={look.heading}>{section.title}</p>
      {section.rows.length > 0 ? (
        section.rows.map((row, rowIndex) => (
          <Row key={rowIndex} row={row} look={look} stacked={stacked} />
        ))
      ) : (
        <PlaceholderLines />
      )}
    </div>
  ));
}

type PageProps = {
  preview: ResumePreview;
  photoUrl: string | null;
};

// The template's colors as CSS variables, so the classes below can use them.
function colorVariables(template: TwoColumnTemplate, preview: ResumePreview): CSSProperties {
  const palette = paletteFor(template, preview.color);
  return {
    "--strong": palette.strong,
    "--accent": palette.accent,
    "--tint": palette.tint,
  } as CSSProperties;
}

function Photo({ url, className }: { url: string; className: string }) {
  return (
    <Image
      // Served by a route that needs the session, so the image optimizer can't fetch it.
      unoptimized
      src={url}
      alt=""
      width={96}
      height={96}
      className={`object-cover ${className}`}
    />
  );
}

function ClassicPage({ preview }: PageProps) {
  return (
    <div
      className={`${paper} px-[7cqw] pt-[6.5cqw] font-(family-name:--font-resume) text-[2.35cqw] leading-[1.35]`}
    >
      {preview.name ? (
        <p className="truncate text-center text-[5.2cqw] leading-tight font-bold">{preview.name}</p>
      ) : (
        <div className="mx-auto h-[4cqw] w-1/2 rounded-full bg-black/10" />
      )}
      <p className="mt-[0.6cqw] truncate text-center text-[2.1cqw]">
        {preview.contact.join("  |  ")}
      </p>

      <Sections sections={preview.sections} look={CLASSIC} />
      {preview.sections.length === 0 && (
        <div className="mt-[4cqw]">
          <PlaceholderLines />
        </div>
      )}
    </div>
  );
}

function SidePanelPage({ preview, photoUrl }: PageProps) {
  return (
    <div
      style={colorVariables("sidepanel", preview)}
      className={`${paper} flex font-(family-name:--font-resume) text-[2.05cqw] leading-[1.35]`}
    >
      <div className="w-[33%] shrink-0 bg-(--tint) px-[3cqw] text-[1.9cqw]">
        <div className="-mx-[3cqw] rounded-b-[50%_3.5cqw] bg-(--strong) px-[3cqw] pt-[6cqw] pb-[6.5cqw]">
          {photoUrl && (
            <Photo
              url={photoUrl}
              className="mx-auto mb-[2cqw] size-[14cqw] rounded-full ring-[0.4cqw] ring-white"
            />
          )}
          {preview.name ? (
            <p className="line-clamp-2 text-center text-[3.5cqw] leading-tight font-bold text-white">
              {preview.name}
            </p>
          ) : (
            <div className="mx-auto h-[3cqw] w-2/3 rounded-full bg-white/30" />
          )}
        </div>
        <p className={SIDE_PANEL.heading}>Contact</p>
        {preview.contact.map((item, index) => (
          <p key={index} className="mb-[0.5cqw] truncate">
            {item}
          </p>
        ))}
        <Sections sections={preview.sideSections} look={SIDE_PANEL} stacked />
      </div>
      <div className="min-w-0 flex-1 px-[4.5cqw] pt-[3.5cqw]">
        <Sections sections={preview.sections} look={SIDE_PANEL} />
        {preview.sections.length === 0 && (
          <div className="mt-[4cqw]">
            <PlaceholderLines />
          </div>
        )}
      </div>
    </div>
  );
}

function BannerPage({ preview, photoUrl }: PageProps) {
  return (
    <div
      style={colorVariables("banner", preview)}
      className={`${paper} flex flex-col font-(family-name:--font-resume-banner) text-[1.9cqw] leading-[1.4]`}
    >
      <div className="flex items-center gap-[3.5cqw] bg-(--strong) px-[6.5cqw] pt-[7cqw] pb-[6cqw] text-white">
        {photoUrl && <Photo url={photoUrl} className="size-[13cqw] shrink-0 rounded-[0.8cqw]" />}
        <div className="min-w-0 flex-1">
          {preview.name ? (
            <p className="truncate text-[5.3cqw] leading-tight font-light uppercase">
              {preview.name}
            </p>
          ) : (
            <div className="h-[4cqw] w-1/2 rounded-full bg-white/30" />
          )}
          <p className="mt-[1.4cqw] flex gap-[2.5cqw] overflow-hidden text-[1.8cqw] whitespace-nowrap text-white/70">
            {preview.contact.map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </p>
        </div>
      </div>
      <div className="flex flex-1">
        <div className="min-w-0 flex-1 border-r border-black/15 pr-[4cqw] pl-[6.5cqw]">
          <Sections sections={preview.sections} look={BANNER} />
          {preview.sections.length === 0 && (
            <div className="mt-[4cqw]">
              <PlaceholderLines />
            </div>
          )}
        </div>
        <div className="w-[32%] shrink-0 pr-[6.5cqw] pl-[4cqw]">
          <Sections sections={preview.sideSections} look={BANNER} stacked />
        </div>
      </div>
    </div>
  );
}

const PAGES = {
  classic: ClassicPage,
  sidepanel: SidePanelPage,
  banner: BannerPage,
};

export function ResumeThumbnail({ preview, photoUrl }: PageProps) {
  const Page = PAGES[preview.template];

  return (
    <div className="@container" aria-hidden="true">
      <Page preview={preview} photoUrl={photoUrl} />
    </div>
  );
}
