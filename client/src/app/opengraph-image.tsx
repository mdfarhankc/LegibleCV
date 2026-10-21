import { ImageResponse } from "next/og";

import { SITE, SITE_DESCRIPTION } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE_DESCRIPTION}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 96,
        background: "#0a0a0a",
        color: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <svg width="112" height="112" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="7" fill="#007751" />
          <path d="M11 7h4.5v14H23v4H11z" fill="#fff" />
        </svg>
        <div style={{ fontSize: 96, fontWeight: 700 }}>{SITE.name}</div>
      </div>
      <div style={{ marginTop: 40, fontSize: 44, color: "#a3a3a3", maxWidth: 900 }}>
        {SITE_DESCRIPTION}
      </div>
    </div>,
    size,
  );
}
