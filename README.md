# MakeMyResume

A resume builder. You fill in your details once, see a live preview while you type, and download the result as a PDF or a Word document.

The default template is built to get through applicant tracking systems: one column, real selectable text, standard headings. There are also two two-column templates for when a person will read the file.

## What works

- Sign up with email, Google or GitHub. Password reset, profile, account deletion.
- Dashboard with a thumbnail of each resume. Create, rename, duplicate, delete, print.
- Editor split into steps (basics, one per section, output) with autosave.
- Live preview next to the form, with the page count and a marker where each new page starts.
- Three templates: Classic, Side panel, Banner.
- On the Side panel and Banner templates: an optional photo you position yourself, a choice of six colors, and icons beside the contact details.
- A personal details section (nationality, visa status, and so on) for applications abroad.
- ATS mode on Classic: plain black text and link addresses printed out.
- PDF export for every template. Word export for Classic, the one layout that stays editable in Word.
- Two resumes per account by default. The limit is stored per user and enforced in the database.

Not done yet: deployment.

## How it fits together

```
client (Next.js)  ──►  Supabase (Postgres, Auth)
       │
       └──────────►  render_service (FastAPI)  ──►  HTML / PDF / DOCX
```

- `client/` - the web app. All database and render calls go through its server side, so the browser never holds a token or talks to the other services directly.
- `render_service/` - takes resume JSON and returns a preview, a PDF or a DOCX. It stores nothing.
- `supabase/` - migrations. Row level security keeps each user's resumes private, and a trigger enforces the resume limit. Photos sit in a private Storage bucket with the same per-user rule.

The resume format is defined once, as Pydantic models in the render service. The client's TypeScript types are generated from it.

## Running locally

You need Docker, [bun](https://bun.sh) and a Supabase project.

1. Render service (in Docker, because WeasyPrint needs Pango):

   ```bash
   docker compose up --build
   ```

   It listens on http://localhost:8000, with API docs at `/docs`.

2. Web app:

   ```bash
   cd client
   bun install
   cp .env.example .env.local   # then fill in your Supabase URL and publishable key
   bun dev
   ```

   It runs at http://localhost:3000.

## Supabase setup

Apply the migrations to your project:

```bash
bunx supabase login
bunx supabase link --project-ref <your-project-ref>
bunx supabase db push
```

In the dashboard, under Authentication:

- URL Configuration: set the Site URL to `http://localhost:3000` and add `http://localhost:3000/**` to the redirect URLs.
- Emails: the default templates work as they are. Their links come back to `/auth/callback`, which only works in the browser the request was made from.
- Emails with custom SMTP (optional): templates can be edited once SMTP is set up. Pointing the links at `/auth/confirm` makes them work in any browser:
  - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
  - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
  - Change email address: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change`
- Providers: enable Google and GitHub if you want social login. Both use `https://<your-project-ref>.supabase.co/auth/v1/callback` as the callback URL.

To give an account more than two resumes, edit `max_resumes` on its row in the `profiles` table. Empty means unlimited.

## Tests

```bash
docker compose run --rm render-service pytest
```

The client has no automated tests yet. `bunx tsc --noEmit` and `bun run lint` are the checks there.
