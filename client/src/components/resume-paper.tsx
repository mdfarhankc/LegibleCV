import type { ReactNode } from "react";

// The page is paper, so it stays white with black ink in both themes.
const paperClass =
  "relative h-[30rem] overflow-hidden rounded-sm bg-white text-black shadow-[0_1px_2px_rgb(0_0_0/0.08),0_12px_32px_-8px_rgb(0_0_0/0.25)] ring-1 ring-black/10";

function PaperFade() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-white to-transparent"
    />
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-3 mb-1.5 border-b border-black pb-px text-[12px] font-bold">{children}</h3>
  );
}

function Row({ left, right }: { left: ReactNode; right: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{left}</span>
      <span className="shrink-0 text-right">{right}</span>
    </div>
  );
}

export function DesignedResume() {
  return (
    <div className="px-5 py-6 font-(family-name:--font-resume) text-[10.5px] leading-[1.4] sm:px-7">
      <p className="text-center text-[22px] leading-tight font-bold">ALEX MORGAN</p>
      <p className="text-center text-[9.5px]">
        Springfield, IL, US &nbsp;|&nbsp;{" "}
        <span className="text-[#0046b4] underline">alex.morgan@example.com</span> &nbsp;|&nbsp;
        +1-555-0100 &nbsp;|&nbsp; <span className="text-[#0046b4] underline">LinkedIn</span>{" "}
        &nbsp;|&nbsp; <span className="text-[#0046b4] underline">GitHub</span>
      </p>

      <Heading>PROFESSIONAL SUMMARY</Heading>
      <p>
        Python developer with 3+ years of experience building web applications with FastAPI and
        Django. Comfortable across PostgreSQL, Redis, Docker, and React.
      </p>

      <Heading>WORK EXPERIENCE</Heading>
      <Row left={<strong>NORTHWIND SYSTEMS LLC</strong>} right="Springfield, IL | Remote" />
      <Row left={<em>Python Developer</em>} right="MAR 2023 - Present" />
      <ul className="list-disc pl-4">
        <li>
          Designed and implemented RESTful APIs using <strong>FastAPI</strong> and{" "}
          <strong>Django</strong> for enterprise clients.
        </li>
        <li>
          Optimized <strong>PostgreSQL</strong> schemas, indexes, and queries to cut response
          times.
        </li>
        <li>
          Containerized services with <strong>Docker</strong> and automated deployments.
        </li>
      </ul>

      <div className="mt-2">
        <Row left={<strong>Contoso Learning Labs</strong>} right="Shelbyville, IL, US" />
        <Row left={<em>Python Developer Intern</em>} right="JUNE 2022 - JAN 2023" />
        <ul className="list-disc pl-4">
          <li>
            Built and maintained REST APIs with <strong>Django REST Framework</strong>.
          </li>
          <li>
            Added automated tests with <strong>Pytest</strong>, raising coverage across releases.
          </li>
        </ul>
      </div>

      <Heading>SKILLS</Heading>
      <p>
        <strong>Backend:</strong> Python (FastAPI, Django, Flask)
      </p>
      <p>
        <strong>Databases:</strong> PostgreSQL, MySQL, MongoDB, Redis
      </p>

      <Heading>EDUCATION</Heading>
      <Row left={<strong>STATE UNIVERSITY, SPRINGFIELD</strong>} right="2019 - 2022" />
      <p>
        <em>Bachelor of Computer Applications</em>
      </p>
    </div>
  );
}

export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {/* Second page peeking out behind the first. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-2.5 translate-y-2.5 rotate-[1.4deg] rounded-sm bg-white/80 ring-1 ring-black/10"
      />
      <div className={paperClass}>
        {children}
        <PaperFade />
      </div>
    </div>
  );
}
