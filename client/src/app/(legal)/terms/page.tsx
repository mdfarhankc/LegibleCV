import type { Metadata } from "next";
import Link from "next/link";

import { PRIVACY_PATH, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `The terms for using ${SITE.name}.`,
};

const UPDATED = "October 8, 2026";

export default function TermsPage() {
  return (
    <>
      <h1 className="font-heading text-4xl font-semibold tracking-tight">Terms of use</h1>
      <p className="mt-3">Last updated {UPDATED}</p>

      <p>
        {SITE.name} is a free resume builder run by {SITE.operator} as a personal project. By
        creating an account or using the site, you agree to these terms. If you do not agree,
        please do not use it.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give an email address you can receive mail at.</li>
        <li>Keep your sign-in details to yourself. You are responsible for what happens in your account.</li>
        <li>One person per account. Accounts are limited in how many resumes they can hold.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        What you write stays yours. You allow the service to store and process it for one purpose:
        to show it back to you and turn it into previews and files. It is not published, sold, or
        used for anything else. The <Link href={PRIVACY_PATH}>privacy policy</Link> has the
        details.
      </p>
      <p>
        You are responsible for what you put in a resume: that it is accurate, that it is yours to
        use, and that it is lawful.
      </p>

      <h2>Acceptable use</h2>
      <p>Please do not:</p>
      <ul>
        <li>try to access other people&apos;s accounts or data;</li>
        <li>overload, probe or disrupt the service, or get around its limits;</li>
        <li>use automated tools to create accounts or generate files in bulk;</li>
        <li>upload anything unlawful, or that infringes someone else&apos;s rights.</li>
      </ul>

      <h2>No promise about results</h2>
      <p>
        The templates are designed to be readable by applicant tracking software, but hiring
        systems differ and change. There is no guarantee that a resume will pass any particular
        system, or that it will lead to an interview or a job. Check your files before you send
        them.
      </p>

      <h2>Availability</h2>
      <p>
        This is a personal project on free hosting. It can be slow to start, be unavailable at
        times, change, or be shut down. Keep your own copy of anything important by downloading
        it.
      </p>

      <h2>Ending your use</h2>
      <p>
        You can delete your account at any time in Settings. Accounts that break these terms, or
        that put the service or other people at risk, may be suspended or removed.
      </p>

      <h2>Liability</h2>
      <p>
        The service is provided as it is, without warranties of any kind. To the extent the law
        allows, the operator is not liable for lost data, lost opportunities, or other losses that
        come from using it or from being unable to use it.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated. The date at the top shows the latest version, and continuing
        to use the site after a change means you accept it.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
      </p>
    </>
  );
}
