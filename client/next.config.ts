import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Autosave and the preview are Server Functions, and their arguments are the resume.
  // Logging every call would print it to the dev terminal on each pause in typing.
  logging: { serverFunctions: false },
};

export default nextConfig;
