import type { AuthUser } from "@/lib/auth/dal";
import type { Resume } from "@/types/resume";

export const DEFAULT_RESUME_TITLE = "Untitled resume";

// Starting content for a new resume: the user's profile plus empty sections in the usual order.
export function newResumeData(user: AuthUser): Resume {
  const { fullName, phone, location } = user.profile;

  return {
    full_name: fullName,
    email: user.email,
    phone: phone || null,
    location: location || null,
    links: [],
    sections: [
      {
        type: "text",
        id: crypto.randomUUID(),
        title: "Professional Summary",
        placement: "auto",
        content: null,
      },
      {
        type: "entries",
        id: crypto.randomUUID(),
        title: "Work Experience",
        placement: "auto",
        items: [],
      },
      {
        type: "entries",
        id: crypto.randomUUID(),
        title: "Education",
        placement: "auto",
        items: [],
      },
      {
        type: "skills",
        id: crypto.randomUUID(),
        title: "Skills",
        placement: "auto",
        groups: [],
      },
    ],
    options: { template: "classic", ats_mode: false, page_size: "A4" },
  };
}
