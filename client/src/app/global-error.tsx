"use client";

import { useEffect } from "react";

import { SITE } from "@/lib/site";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Replaces the root layout, so nothing from it (fonts, theme, components) is available here.
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "96px 16px",
        }}
      >
        <title>{`Something went wrong | ${SITE.name}`}</title>
        <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
        <p style={{ opacity: 0.7, marginTop: 8 }}>{SITE.name} didn&apos;t load. Try again in a moment.</p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: 24,
            padding: "10px 20px",
            border: 0,
            borderRadius: 8,
            background: "#007751",
            color: "#fff",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
