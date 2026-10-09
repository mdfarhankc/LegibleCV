// Colors of the two-column templates. The PDF takes them from the render service (PALETTES in
// render_service/app/rendering/styles.py). I repeat them here for the thumbnails and the picker.

export const COLORS = ["default", "navy", "slate", "teal", "forest", "maroon", "plum"] as const;

export type ColorName = (typeof COLORS)[number];
export type NamedColor = Exclude<ColorName, "default">;

export type Palette = {
  // Behind white text: the side panel's cap, the banner's band.
  strong: string;
  // Colored text on white.
  accent: string;
  // The side panel's background.
  tint: string;
};

const PALETTES: Record<NamedColor, Palette> = {
  navy: { strong: "#0d1746", accent: "#1c3faa", tint: "#eef0f6" },
  slate: { strong: "#2e3443", accent: "#475069", tint: "#eff0f3" },
  teal: { strong: "#0f4c4a", accent: "#0f6e6a", tint: "#e9f3f2" },
  forest: { strong: "#1e4a2c", accent: "#2a6b3f", tint: "#ecf3ee" },
  maroon: { strong: "#5c1a26", accent: "#8c2636", tint: "#f6ecee" },
  plum: { strong: "#41205a", accent: "#6a3791", tint: "#f2ecf6" },
};

// What "default" looks like on each template.
const TEMPLATE_DEFAULT: Record<TwoColumnTemplate, NamedColor> = {
  sidepanel: "navy",
  banner: "slate",
};

export type TwoColumnTemplate = "sidepanel" | "banner";

export const COLOR_LABELS: Record<NamedColor, string> = {
  navy: "Navy",
  slate: "Slate",
  teal: "Teal",
  forest: "Forest",
  maroon: "Maroon",
  plum: "Plum",
};

export const NAMED_COLORS = COLORS.filter((color): color is NamedColor => color !== "default");

// The color a template is actually drawn in.
export function resolveColor(template: TwoColumnTemplate, color: ColorName): NamedColor {
  return color === "default" ? TEMPLATE_DEFAULT[template] : color;
}

export function paletteFor(template: TwoColumnTemplate, color: ColorName): Palette {
  return PALETTES[resolveColor(template, color)];
}
