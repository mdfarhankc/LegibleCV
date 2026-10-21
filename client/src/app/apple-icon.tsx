import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself.
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#007751" }}>
      <svg width="180" height="180" viewBox="0 0 32 32">
        <path d="M11 7h4.5v14H23v4H11z" fill="#fff" />
      </svg>
    </div>,
    size,
  );
}
