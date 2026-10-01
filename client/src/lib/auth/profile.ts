import { z } from "zod";

export type Profile = {
  fullName: string;
  phone: string;
  location: string;
  // Set by Google and GitHub sign-in. Empty for email accounts.
  avatarUrl: string;
};

export const profileSchema = z.object({
  full_name: z.string().trim().max(200, "Use at most 200 characters."),
  phone: z.string().trim().max(40, "Use at most 40 characters."),
  location: z.string().trim().max(200, "Use at most 200 characters."),
});

// User metadata is writable by the user, so every field is parsed and bad values are dropped.
const text = (max: number) => z.string().trim().max(max).catch("");

const httpsUrl = z
  .string()
  .max(2048)
  .refine((value) => value.startsWith("https://") && URL.canParse(value))
  .catch("");

const metadataSchema = z
  .object({
    full_name: text(200),
    // Google and GitHub send the name under `name` as well.
    name: text(200),
    phone: text(40),
    location: text(200),
    avatar_url: httpsUrl,
    // Google also sends the picture under `picture`.
    picture: httpsUrl,
  })
  .catch({ full_name: "", name: "", phone: "", location: "", avatar_url: "", picture: "" });

export function readProfile(metadata: unknown): Profile {
  const parsed = metadataSchema.parse(metadata ?? {});
  return {
    fullName: parsed.full_name || parsed.name,
    phone: parsed.phone,
    location: parsed.location,
    avatarUrl: parsed.avatar_url || parsed.picture,
  };
}
