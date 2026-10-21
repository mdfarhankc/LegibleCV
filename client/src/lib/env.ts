import { z } from "zod";

const url = z.url().transform((value) => value.replace(/\/+$/, ""));

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  RENDER_SERVICE_URL: url,
  SITE_URL: url,
});

// NEXT_PUBLIC_ vars are inlined at build time, so each one has to be referenced literally.
const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  RENDER_SERVICE_URL: process.env.RENDER_SERVICE_URL,
  SITE_URL: process.env.SITE_URL,
});

if (!parsed.success) {
  const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Missing or invalid env vars: ${names}. See .env.example.`);
}

export const env = {
  supabaseUrl: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  renderServiceUrl: parsed.data.RENDER_SERVICE_URL,
  siteUrl: parsed.data.SITE_URL,
};
