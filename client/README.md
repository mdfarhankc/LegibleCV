# Client

The web app: landing page, sign-in, dashboard and the resume editor. Next.js 16 with the App Router, Tailwind v4 and shadcn/ui.

## Setup

```bash
bun install
cp .env.example .env.local
bun dev
```

Fill `.env.local` with your Supabase project URL and publishable key. `NEXT_PUBLIC_API_URL` points to the render service (http://localhost:8000 when it runs with Docker Compose).

The app runs at http://localhost:3000. The preview and the downloads need the render service to be running.

## Pages

- `/` - landing page
- `/login`, `/signup`, `/forgot-password`, `/update-password`
- `/dashboard` - your resumes
- `/editor/[id]` - the editor and preview
- `/editor/[id]/export/pdf` and `/export/docx` - file downloads
- `/editor/[id]/photo` - the resume's photo, for the editor thumbnail
- `/settings` - profile, email, password, delete account
- `/privacy`, `/terms` - the privacy policy and terms of use. The operator name and contact address they show are in `src/lib/site.ts`.
- `/auth/confirm`, `/auth/callback` - where email links and social logins land

## How data moves

Everything goes through the server. Pages read data in Server Components, and changes are Server Actions. There is no Supabase client in the browser.

- `src/proxy.ts` refreshes the session and redirects signed-out visitors. It's a convenience, not the security check.
- `src/lib/auth/dal.ts` verifies the session on the server. Every query and action calls it.
- Row level security in the database decides what each user can touch.

Photos are positioned in a crop dialog and resized to a 400 px square JPEG in the browser, uploaded through a Server Action, and kept in a private bucket. When a resume is rendered, the server reads the photo and sends it along with the resume.

Passkeys follow the same rule. The server asks Supabase for a challenge and verifies the answer (`lib/auth/passkey-actions.ts`); the browser only runs the device prompt (`lib/auth/passkey-browser.ts`).

The editor keeps its state in React Hook Form. It saves a second after you stop typing, and asks the render service for a new preview on the same delay.

## Where things are

```
src/
  app/                 routes
  components/editor/   the editor: steps, fields, preview, autosave
  components/ui/       shadcn/ui components
  lib/auth/            sign-in, account actions, session checks
  lib/resumes/         queries, actions, the form model, render calls
  lib/supabase/        Supabase clients for the server and the proxy
  types/               generated types
```

`lib/resumes/form.ts` is worth reading first. It defines the shape the editor works on and converts it to and from the stored resume.

## Generated types

Two files in `src/types` are generated. Don't edit them by hand.

- `api.ts` comes from the render service. Run `bun run types:api` after changing its Pydantic models (the service must be running).
- `database.ts` comes from the Supabase schema. Run `bun run types:db` after pushing a migration (needs `bunx supabase login` and a linked project).

## Template colors

`src/lib/resumes/colors.ts` repeats the palette from the render service (`PALETTES` in `rendering/styles.py`), so thumbnails and the color picker can draw it. Change both together.

## Checks

```bash
bunx tsc --noEmit
bun run lint
bun run build
```
