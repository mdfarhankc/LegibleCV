# MakeMyResume

A resume builder that exports ATS-friendly PDFs and editable Word documents.

Still in progress. The render service and database are done, the web app is next.

## Repo layout

- `client/` - Next.js web app
- `render_service/` - FastAPI service that turns resume JSON into HTML, PDF and DOCX
- `supabase/` - database migrations (Postgres + Auth)

## Running locally

Render service (runs in Docker because WeasyPrint needs Pango):

```bash
docker compose up --build
```

API docs are at http://localhost:8000/docs.

Web app:

```bash
cd client
bun install
bun dev
```

Each app has a `.env.example`. Copy it to `.env` (render service) or `.env.local` (client) and fill in your Supabase project values.

## Database

Migrations live in `supabase/migrations`. To apply them to a linked project:

```bash
bunx supabase db push
```
