import { z } from "zod";

import { type ColorName, COLORS } from "@/lib/resumes/colors";
import { isSideByDefault, TEMPLATES, type TemplateName } from "@/lib/resumes/form";

// What the dashboard thumbnail draws. Built from stored JSON, which is not trusted to match
// the Resume type, so everything is parsed loosely and bad values fall back to empty.

export type PreviewRow = {
  text: string;
  right?: string;
  // Skill groups only. Printed before the text, or above it in a narrow column.
  label?: string;
  style: "bold" | "italic" | "plain" | "bullet";
};

export type PreviewSection = {
  title: string;
  rows: PreviewRow[];
};

export type ResumePreview = {
  template: TemplateName;
  color: ColorName;
  name: string;
  contact: string[];
  sections: PreviewSection[];
  // Only filled on the two-column templates.
  sideSections: PreviewSection[];
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

const detailSchema = z.object({ label: text, value: text });

const sectionSchema = z.object({
  type: text,
  title: text,
  placement: text,
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
    options: z
      .object({
        template: z.enum(TEMPLATES).catch("classic"),
        color: z.enum(COLORS).catch("default"),
      })
      .catch({ template: "classic", color: "default" }),
  })
  .catch({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    sections: [],
    options: { template: "classic", color: "default" },
  });

type StoredSection = z.infer<typeof sectionSchema>;
export type StoredResume = z.infer<typeof resumeSchema>;

// Parsed once per row, then read by both functions below.
export function parseStoredResume(data: unknown): StoredResume {
  return resumeSchema.parse(data ?? {});
}

// Rich text uses **bold**; the thumbnail is too small for it to matter.
const plain = (value: string) => value.replaceAll("**", "");

function dateRange(entry: z.infer<typeof entrySchema>): string {
  const end = entry.is_current ? "Present" : entry.end;
  return entry.start && end ? `${entry.start} - ${end}` : entry.start || end;
}

function entryRows(item: unknown, classic: boolean): PreviewRow[] {
  const parsed = entrySchema.safeParse(item);
  if (!parsed.success || !parsed.data.title) {
    return [];
  }
  const entry = parsed.data;
  const dates = dateRange(entry);
  const rows: PreviewRow[] = [];
  if (classic) {
    rows.push({ text: entry.title, right: entry.location || dates, style: "bold" });
    if (entry.subtitle) {
      rows.push({ text: entry.subtitle, right: entry.location ? dates : "", style: "italic" });
    }
  } else {
    // The two-column templates put the dates beside the title and the location under it.
    rows.push({ text: entry.title, right: dates, style: "bold" });
    const subtitle = [entry.subtitle, entry.location].filter(Boolean).join(", ");
    if (subtitle) {
      rows.push({ text: subtitle, style: "italic" });
    }
  }
  for (const bullet of entry.bullets) {
    rows.push({ text: plain(bullet), style: "bullet" });
  }
  return rows;
}

function sectionRows(section: StoredSection, classic: boolean): PreviewRow[] {
  const strings = section.items.filter((item): item is string => typeof item === "string");

  switch (section.type) {
    case "text":
      return section.content ? [{ text: plain(section.content), style: "plain" }] : [];
    case "entries":
      return section.items.flatMap((item) => entryRows(item, classic));
    case "skills":
      return section.groups
        .filter((group) => group.items.length > 0)
        .map((group) => ({ label: group.label, text: group.items.join(", "), style: "plain" }));
    case "details":
      return section.items.flatMap((item): PreviewRow[] => {
        const detail = detailSchema.safeParse(item);
        return detail.success && detail.data.label && detail.data.value
          ? [{ label: detail.data.label, text: detail.data.value, style: "plain" }]
          : [];
      });
    case "bullets":
      return strings.map((item) => ({ text: plain(item), style: "bullet" }));
    case "inline":
      // One line on a full-width column, one item per line in the narrow one.
      if (!classic && isSide(section)) {
        return strings.map((item) => ({ text: item, style: "plain" }));
      }
      return strings.length > 0 ? [{ text: strings.join("  |  "), style: "plain" }] : [];
    default:
      return [];
  }
}

function isSide(section: StoredSection): boolean {
  if (section.placement === "side") {
    return true;
  }
  return section.placement !== "main" && isSideByDefault(section.type);
}

// The render service needs a name and an email, so a resume without them can't be downloaded yet.
export function canExportResume(resume: StoredResume): boolean {
  return Boolean(resume.full_name.trim() && resume.email.trim());
}

export function buildResumePreview(resume: StoredResume): ResumePreview {

  const template = resume.options.template;
  const classic = template === "classic";
  const titled = resume.sections.filter((section) => section.title);

  const build = (sections: StoredSection[]): PreviewSection[] =>
    sections.slice(0, MAX_SECTIONS).map((section) => ({
      title: section.title,
      rows: sectionRows(section, classic).slice(0, MAX_ROWS),
    }));

  return {
    template,
    color: resume.options.color,
    name: resume.full_name,
    contact: [resume.location, resume.email, resume.phone].filter(Boolean),
    sections: build(classic ? titled : titled.filter((section) => !isSide(section))),
    sideSections: classic ? [] : build(titled.filter(isSide)),
  };
}
