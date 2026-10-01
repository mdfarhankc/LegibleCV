import { z } from "zod";

const email = z.email("Enter a valid email address.");

const newPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({ email, password: newPassword });

export const emailSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    password: newPassword,
    confirm: z.string().min(1, "Confirm password is required."),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "The passwords don't match.",
  });

export const OAUTH_PROVIDERS = ["google", "github"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];
export const oauthProviderSchema = z.enum(OAUTH_PROVIDERS);
