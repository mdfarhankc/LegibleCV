import type { Resume, Section } from "@/types/resume";

// A resume being written is allowed to be incomplete, but the render service validates the
// full contract. This drops the parts that aren't ready yet instead of failing the render.
function cleanSection(section: Section): Section | null {
  if (!section.title.trim()) {
    return null;
  }
  switch (section.type) {
    case "text":
      return section.content ? section : null;
    case "entries": {
      const items = section.items.filter((item) => item.title.trim());
      return items.length > 0 ? { ...section, items } : null;
    }
    case "skills": {
      const groups = section.groups.filter((group) => group.label.trim() && group.items.length > 0);
      return groups.length > 0 ? { ...section, groups } : null;
    }
    case "details": {
      const items = section.items.filter((item) => item.label && item.value);
      return items.length > 0 ? { ...section, items } : null;
    }
    case "bullets":
    case "inline":
      return section.items.length > 0 ? section : null;
  }
}

export function toRenderPayload(resume: Resume): Resume {
  return {
    ...resume,
    sections: resume.sections.flatMap((section) => cleanSection(section) ?? []),
  };
}
