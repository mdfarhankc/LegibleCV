import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Next inlines its own scripts and styles without a nonce, hence 'unsafe-inline'. A nonce would
// make every page render dynamically. Dev also needs 'unsafe-eval' for fast refresh.
// The preview iframe is srcdoc, so it inherits this policy: its fonts and photo come from 'self'
// and data: URLs.
// Sign-in forms redirect through Supabase to Google and GitHub, and form-action covers redirects.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://avatars.githubusercontent.com",
  "font-src 'self'",
  "connect-src 'self'",
  `form-action 'self' ${supabaseUrl} https://accounts.google.com https://github.com`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  // Autosave and the preview are Server Functions, and their arguments are the resume.
  // Logging every call would print it to the dev terminal on each pause in typing.
  logging: { serverFunctions: false },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
