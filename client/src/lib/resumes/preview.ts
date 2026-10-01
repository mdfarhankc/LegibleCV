import { z } from "zod";

// What the dashboard thumbnail draws. Built from stored JSON, which is not trusted to match
// the Resume type, so everything is parsed loosely and bad values fall back to empty.

export type PreviewRow = {
  text: string;
  right?: string;
  style: "bold" | "italic" | "plain" | "bullet";
};

export type PreviewSection = {
  title: string;
  rows: PreviewRow[];
};

export type ResumePreview = {
  name: string;
  contact: string;
  sections: PreviewSection[];
};

const MAX_SECTIONS = 5;
const MAX_ROWS = 7;

const text = z.string().catch("");
const strings = z.array(z.string()).catch([]);

const entrySchema = z.object({
  title: text,
  subtitle: text,
  location: text,
  start: text,
  end: text,
  is_current: z.boolean().catch(false),
  bullets: strings,
});

const sectionSchema = z.object({
  type: text,
  title: text,
  content: text,
  items: z.array(z.unknown()).catch([]),
  groups: z.array(z.object({ label: text, items: strings })).catch([]),
});

const resumeSchema = z
  .object({
    full_name: text,
    email: text,
    phone: text,
    location: text,
    sections: z.array(sectionSchema.catch(sectionSchema.parse({}))).catch([]),
  })
  .catch({ full_name: "", email: "", phone: "", location: "", sections: [] });

// Rich text uses **bold**; the thumbnail is too small for it to matter.
const plain = (value: string) => value.replaceAll("**", "");

function dateRange(entry: z.infer<typeof entrySchema>): string {
  const end = entry.is_current ? "Present" : entry.end;
  return entry.start && end ? `${entry.start} - ${end}` : entry.start || end;
}

function entryRows(item: unknown): PreviewRow[] {
  const parsed = entrySchema.safeParse(item);
  if (!parsed.success || !parsed.data.title) {
    return [];
  }
  const entry = parsed.data;
  const dates = dateRange(entry);
  const rows: PreviewRow[] = [
    { text: entry.title, right: entry.location || dates, style: "bold" },
  ];
  if (entry.subtitle) {
    rows.push({ text: entry.subtitle, right: entry.location ? dates : "", style: "italic" });
  }
  for (const bullet of entry.bullets) {
    rows.push({ text: plain(bullet), style: "bullet" });
  }
  return rows;
}

function sectionRows(section: z.infer<typeof sectionSchema>): PreviewRow[] {
  switch (section.type) {
    case "text":
      return section.content ? [{ text: plain(section.content), style: "plain" }] : [];
    case "entries":
      return section.items.flatMap(entryRows);
    case "skills":
      return section.groups
        .filter((group) => group.items.length > 0)
        .map((group) => ({ text: `${group.label}: ${group.items.join(", ")}`, style: "plain" }));
    case "bullets":
      return section.items
        .filter((item): item is string => typeof item === "string")
        .map((item) => ({ text: plain(item), style: "bullet" }));
    case "inline": {
      const joined = section.items.filter((item) => typeof item === "string").join("  |  ");
      return joined ? [{ text: joined, style: "plain" }] : [];
    }
    default:
      return [];
  }
}

export function buildResumePreview(data: unknown): ResumePreview {
  const resume = resumeSchema.parse(data ?? {});

  return {
    name: resume.full_name,
    contact: [resume.location, resume.email, resume.phone].filter(Boolean).join("  |  "),
    sections: resume.sections
      .filter((section) => section.title)
      .slice(0, MAX_SECTIONS)
      .map((section) => ({
        title: section.title.toUpperCase(),
        rows: sectionRows(section).slice(0, MAX_ROWS),
      })),
  };
}
