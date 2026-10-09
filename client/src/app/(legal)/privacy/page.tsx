import type { Metadata } from "next";
import Link from "next/link";

import { SETTINGS_PATH } from "@/lib/auth/routes";
import { SITE, TERMS_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `What ${SITE.name} stores about you, why, and how to delete it.`,
};

const UPDATED = "October 8, 2026";

export default function PrivacyPage() {
  const mail = `mailto:${SITE.contactEmail}`;

  return (
    <>
      <h1 className="font-heading text-4xl font-semibold tracking-tight">Privacy policy</h1>
      <p className="mt-3">Last updated {UPDATED}</p>

      <p>
        {SITE.name} is a resume builder run by {SITE.operator} as a personal project. This page
        says what is stored about you, why, and how to remove it. Questions go to{" "}
        <a href={mail}>{SITE.contactEmail}</a>.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>What you type into a resume is stored so you can come back and edit it.</li>
        <li>Nothing is sold, shared for advertising, or used to train AI models.</li>
        <li>There are no advertising or analytics trackers on the site.</li>
        <li>Deleting your account removes your resumes, photos and profile.</li>
      </ul>

      <h2>What is stored</h2>
      <ul>
        <li>
          <strong>Account.</strong> Your email address and name. If you set a password, only a
          scrambled (hashed) form of it is kept. If you sign in with Google or GitHub, the name,
          email address and profile picture link that they send.
        </li>
        <li>
          <strong>Profile.</strong> The name, phone number and location you save in Settings.
        </li>
        <li>
          <strong>Resumes.</strong> Everything you enter: contact details, work history,
          education, skills, personal details, and the options you pick.
        </li>
        <li>
          <strong>Photos.</strong> A photo you add to a resume, resized in your browser before it
          is uploaded.
        </li>
        <li>
          <strong>Passkeys.</strong> If you add one, its public key and a device name. The private
          part never leaves your device.
        </li>
        <li>
          <strong>Technical records.</strong> The companies that host the site keep standard logs
          of requests, such as IP address, browser type and time.
        </li>
      </ul>

      <h2>What it is used for</h2>
      <ul>
        <li>To sign you in and keep your account secure.</li>
        <li>To save your resumes and turn them into previews, PDFs and Word files.</li>
        <li>
          To send emails you asked for: confirming your address, resetting a password, or changing
          your email.
        </li>
        <li>To keep the service running and stop abuse.</li>
      </ul>
      <p>Your information is not used for marketing, and you will not receive newsletters.</p>

      <h2>Cookies and browser storage</h2>
      <p>
        The site sets cookies that keep you signed in. Your light or dark theme choice is saved in
        your browser. There are no advertising or tracking cookies.
      </p>

      <h2>Who else handles it</h2>
      <p>The site runs on services from other companies. They process data only to provide it:</p>
      <ul>
        <li>
          <strong>Supabase</strong> stores accounts, resumes and photos, and sends account emails.
        </li>
        <li>
          <strong>Vercel</strong> hosts the website.
        </li>
        <li>
          <strong>Render</strong> hosts the service that produces previews and files. It receives a
          resume to render it and does not keep it.
        </li>
        <li>
          <strong>Google and GitHub</strong>, only if you choose to sign in with them.
        </li>
      </ul>
      <p>
        Their servers may be in a different country from yours. Information is also disclosed if
        the law requires it.
      </p>

      <h2>How long it is kept</h2>
      <p>
        Until you delete it. Deleting a resume removes it and its photo. Deleting your account in{" "}
        <Link href={SETTINGS_PATH}>Settings</Link> removes your account, profile, resumes and
        photos. Hosting logs and provider backups can hold traces for a limited time after that.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>See and correct your information in the editor and in Settings.</li>
        <li>Download any resume as a PDF.</li>
        <li>Delete a resume, or your whole account, at any time.</li>
        <li>
          Ask about your data, or ask for something this page does not cover, by emailing{" "}
          <a href={mail}>{SITE.contactEmail}</a>.
        </li>
      </ul>
      <p>
        Depending on where you live, the law may give you further rights over your data. Email the
        address above to use them.
      </p>

      <h2>Security</h2>
      <p>
        Connections to the site are encrypted, and database rules limit each account to its own
        resumes and photos. No service can promise perfect security, so avoid putting information
        in a resume that you would not want exposed, such as full passport or ID numbers.
      </p>

      <h2>Children</h2>
      <p>
        The service is meant for people looking for work and is not directed at children under 16.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the date at the top changes with it. Significant changes will be
        noted on the site. See also the <Link href={TERMS_PATH}>terms of use</Link>.
      </p>
    </>
  );
}
