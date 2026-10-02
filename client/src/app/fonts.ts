import { Carlito, Poppins } from "next/font/google";

// Same metrics as Calibri, and the font the exported PDF uses. For the resume mock only.
export const resumeFont = Carlito({
  variable: "--font-resume",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

// The Banner template's font, for its thumbnail.
export const bannerFont = Poppins({
  variable: "--font-resume-banner",
  weight: ["300", "400", "600"],
  subsets: ["latin"],
});
