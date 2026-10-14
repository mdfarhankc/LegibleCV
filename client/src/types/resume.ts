// Aliases over the generated contract. Regenerate api.ts with `bun run types:api`.
import type { components } from "@/types/api";

type Schemas = components["schemas"];

export type Resume = Schemas["Resume"];
export type Entry = Schemas["Entry"];

export type Section = Resume["sections"][number];
export type SectionType = Section["type"];
