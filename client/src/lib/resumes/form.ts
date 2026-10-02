import { z } from "zod";

import type { Entry, Resume, Section, SectionType } from "@/types/resume";

// The editor works on a shape made for inputs: blank text is "" instead of null, and lists
// that are typed line by line (bullets) or comma by comma (skills) are single strings.
// toFormValues() and toResume() convert at the edges.

export const LIMITS = {
  links: 10,
  sections: 20,
  entries: 30,
  groups: 20,
  listItems: 30,
  skillItems: 50,
} as const;

const SECTION_TYPES = ["text", "entries", "skills", "bullets", "inline"] as const;
const PAGE_SIZES = ["A4", "Letter"] as const;
export const TEMPLATES = ["classic", "sidepanel", "banner"] as const;
const PLACEMENTS = ["auto", "main", "side"] as const;

// ---------------------------------------------------------------------------
// Save schema. Enforces the render service's size limits. Nothing is required,
// because a resume being written is allowed to be incomplete.
// ---------------------------------------------------------------------------

const text = (max: number) => z.string().max(max, `Use at most ${max} characters.`);

function splitLines(value: string): string[] {
  return (
    value
      .split("\n")
      // Pasted lists often carry their own markers.
      .map((line) => line.replace(/^\s*(?:[-*•]\s+)?/, "").trim())
      .filter(Boolean)
  );
}

// Commas inside brackets don't split: "Python (FastAPI, Django), Go" is two items.
function splitCommas(value: string): string[] {
  const items: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    }
    if (char === "," && depth === 0) {
      items.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  items.push(current);
  return items.map((item) => item.trim()).filter(Boolean);
}

const lineList = (maxItems: number, maxLength: number) =>
  z.string().superRefine((value, context) => {
    const lines = splitLines(value);
    if (lines.length > maxItems) {
      context.addIssue({ code: "custom", message: `Use at most ${maxItems} lines.` });
    }
    if (lines.some((line) => line.length > maxLength)) {
      context.addIssue({
        code: "custom",
        message: `Keep each line under ${maxLength} characters.`,
      });
    }
  });

const optionalEmail = z
  .string()
  .max(254, "Use at most 254 characters.")
  .refine((value) => value.trim() === "" || z.email().safeParse(value.trim()).success, {
    message: "Enter a valid email address.",
  });

function isHttpUrl(value: string): boolean {
  if (!URL.canParse(value)) {
    return false;
  }
  const { protocol } = new URL(value);
  return protocol === "https:" || protocol === "http:";
}

const optionalUrl = z
  .string()
  .max(2048, "Use at most 2048 characters.")
  .refine((value) => value.trim() === "" || isHttpUrl(value.trim()), {
    message: "Enter a full address, starting with https://",
  });

const linkSchema = z.object({ label: text(80), url: optionalUrl });

const entrySchema = z.object({
  title: text(200),
  subtitle: text(200),
  location: text(200),
  start: text(200),
  end: text(200),
  is_current: z.boolean(),
  meta: text(200),
  link_label: text(80),
  link_url: optionalUrl,
  description: text(3000),
  bullets: lineList(LIMITS.listItems, 3000),
});

const skillGroupSchema = z.object({
  label: text(80),
  items: z.string().superRefine((value, context) => {
    const items = splitCommas(value);
    if (items.length > LIMITS.skillItems) {
      context.addIssue({ code: "custom", message: `Use at most ${LIMITS.skillItems} items.` });
    }
    if (items.some((item) => item.length > 200)) {
      context.addIssue({ code: "custom", message: "Keep each item under 200 characters." });
    }
  }),
});

// One flat shape for every section type. Fields a type doesn't use stay empty.
const sectionSchema = z.object({
  sectionId: z.string().min(1).max(64),
  type: z.enum(SECTION_TYPES),
  title: text(80),
  // Which column on the two-column templates. Classic ignores it.
  placement: z.enum(PLACEMENTS),
  content: text(3000),
  items: z.array(entrySchema).max(LIMITS.entries),
  groups: z.array(skillGroupSchema).max(LIMITS.groups),
  listText: lineList(LIMITS.listItems, 3000),
});

export const resumeFormSchema = z.object({
  title: z.string().trim().min(1, "Give the resume a title.").max(120, "Use at most 120 characters."),
  full_name: text(200),
  email: optionalEmail,
  phone: text(40),
  location: text(200),
  links: z.array(linkSchema).max(LIMITS.links),
  sections: z.array(sectionSchema).max(LIMITS.sections),
  template: z.enum(TEMPLATES),
  ats_mode: z.boolean(),
  page_size: z.enum(PAGE_SIZES),
});

export type ResumeFormValues = z.infer<typeof resumeFormSchema>;
export type SectionValues = ResumeFormValues["sections"][number];
export type EntryValues = SectionValues["items"][number];
export type TemplateName = (typeof TEMPLATES)[number];

// ---------------------------------------------------------------------------
// New items
// ---------------------------------------------------------------------------

export function emptyEntry(): EntryValues {
  return {
    title: "",
    subtitle: "",
    location: "",
    start: "",
    end: "",
    is_current: false,
    meta: "",
    link_label: "",
    link_url: "",
    description: "",
    bullets: "",
  };
}

export function emptySection(type: SectionType, title: string): SectionValues {
  return {
    sectionId: crypto.randomUUID(),
    type,
    title,
    placement: "auto",
    content: "",
    items: [],
    groups: [],
    listText: "",
  };
}

export const SECTION_PRESETS: { label: string; type: SectionType; title: string }[] = [
  { label: "Summary", type: "text", title: "Professional Summary" },
  { label: "Experience", type: "entries", title: "Work Experience" },
  { label: "Projects", type: "entries", title: "Projects" },
  { label: "Education", type: "entries", title: "Education" },
  { label: "Skills", type: "skills", title: "Skills" },
  // Label and value pairs: date of birth, nationality, and so on.
  { label: "Personal details", type: "skills", title: "Personal details" },
  { label: "Awards", type: "entries", title: "Awards & Achievements" },
  { label: "Languages", type: "inline", title: "Languages" },
  { label: "Custom text", type: "text", title: "" },
  { label: "Custom list", type: "bullets", title: "" },
];

// ---------------------------------------------------------------------------
// Stored JSON -> form. The column is jsonb, so nothing about its shape is assumed.
// ---------------------------------------------------------------------------

const stored = {
  text: z
    .string()
    .nullish()
    .transform((value) => value ?? "")
    .catch(""),
  strings: z.array(z.string()).catch([]),
};

const storedLink = z.object({ label: stored.text, url: stored.text });

const storedEntry = z.object({
  title: stored.text,
  subtitle: stored.text,
  location: stored.text,
  start: stored.text,
  end: stored.text,
  is_current: z.boolean().catch(false),
  meta: stored.text,
  link: storedLink.nullish().catch(null),
  description: stored.text,
  bullets: stored.strings,
});

const storedSection = z.object({
  id: stored.text,
  type: z.enum(SECTION_TYPES),
  title: stored.text,
  placement: z.enum(PLACEMENTS).catch("auto"),
  content: stored.text,
  items: z.array(z.unknown()).catch([]),
  groups: z.array(z.object({ label: stored.text, items: stored.strings })).catch([]),
});

const storedResume = z.object({
  full_name: stored.text,
  email: stored.text,
  phone: stored.text,
  location: stored.text,
  links: z.array(storedLink).catch([]),
  sections: z.array(z.unknown()).catch([]),
  options: z
    .object({
      template: z.enum(TEMPLATES).catch("classic"),
      ats_mode: z.boolean().catch(false),
      page_size: z.enum(PAGE_SIZES).catch("A4"),
    })
    .catch({ template: "classic", ats_mode: false, page_size: "A4" }),
});

function sectionToForm(raw: unknown): SectionValues | null {
  const parsed = storedSection.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const section = parsed.data;
  const base = emptySection(section.type, section.title);
  base.placement = section.placement;
  if (section.id) {
    base.sectionId = section.id;
  }

  switch (section.type) {
    case "text":
      return { ...base, content: section.content };
    case "entries":
      return {
        ...base,
        items: section.items.flatMap((item) => {
          const entry = storedEntry.safeParse(item);
          if (!entry.success) {
            return [];
          }
          const { link, bullets, ...fields } = entry.data;
          return [
            {
              ...fields,
              link_label: link?.label ?? "",
              link_url: link?.url ?? "",
              bullets: bullets.join("\n"),
            },
          ];
        }),
      };
    case "skills":
      return {
        ...base,
        groups: section.groups.map((group) => ({ label: group.label, items: group.items.join(", ") })),
      };
    case "bullets":
    case "inline":
      return {
        ...base,
        listText: section.items.filter((item) => typeof item === "string").join("\n"),
      };
  }
}

export function toFormValues(title: string, data: unknown): ResumeFormValues {
  const resume = storedResume.catch(storedResume.parse({})).parse(data ?? {});

  return {
    title,
    full_name: resume.full_name,
    email: resume.email,
    phone: resume.phone,
    location: resume.location,
    links: resume.links,
    sections: resume.sections.flatMap((section) => sectionToForm(section) ?? []),
    template: resume.options.template,
    ats_mode: resume.options.ats_mode,
    page_size: resume.options.page_size,
  };
}

// ---------------------------------------------------------------------------
// Form -> stored contract
// ---------------------------------------------------------------------------

const optional = (value: string) => value.trim() || null;

function toEntry(values: EntryValues): Entry {
  const url = values.link_url.trim();
  return {
    title: values.title.trim(),
    subtitle: optional(values.subtitle),
    location: optional(values.location),
    start: optional(values.start),
    end: values.is_current ? null : optional(values.end),
    is_current: values.is_current,
    meta: optional(values.meta),
    link: url ? { label: values.link_label.trim() || "Link", url } : null,
    description: optional(values.description),
    bullets: splitLines(values.bullets),
  };
}

function toSection(values: SectionValues): Section {
  const base = {
    id: values.sectionId,
    title: values.title.trim(),
    placement: values.placement,
  };

  switch (values.type) {
    case "text":
      return { ...base, type: "text", content: optional(values.content) };
    case "entries":
      return { ...base, type: "entries", items: values.items.map(toEntry) };
    case "skills":
      return {
        ...base,
        type: "skills",
        groups: values.groups.map((group) => ({
          label: group.label.trim(),
          items: splitCommas(group.items),
        })),
      };
    case "bullets":
      return { ...base, type: "bullets", items: splitLines(values.listText) };
    case "inline":
      return { ...base, type: "inline", items: splitLines(values.listText) };
  }
}

export function toResume(values: ResumeFormValues): Resume {
  return {
    full_name: values.full_name.trim(),
    email: values.email.trim(),
    phone: optional(values.phone),
    location: optional(values.location),
    links: values.links
      .filter((link) => link.url.trim())
      .map((link) => ({ label: link.label.trim() || "Link", url: link.url.trim() })),
    sections: values.sections.map(toSection),
    options: {
      template: values.template,
      ats_mode: values.ats_mode,
      page_size: values.page_size,
    },
  };
}
