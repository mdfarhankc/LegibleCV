// Aliases over the generated contract. Regenerate api.ts with `bun run types:api`.
import type { components } from "@/types/api";

type Schemas = components["schemas"];

export type Resume = Schemas["Resume"];
export type ResumeOptions = Schemas["ResumeOptions"];
export type Link = Schemas["Link"];
export type Entry = Schemas["Entry"];
export type SkillGroup = Schemas["SkillGroup"];

export type Section = Resume["sections"][number];
export type SectionType = Section["type"];
export type TextSection = Schemas["TextSection"];
export type EntriesSection = Schemas["EntriesSection"];
export type SkillsSection = Schemas["SkillsSection"];
export type BulletsSection = Schemas["BulletsSection"];
export type InlineSection = Schemas["InlineSection"];
