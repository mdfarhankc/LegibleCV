# Client

Next.js web app for editing resumes and exporting them.

## Setup

```bash
bun install
cp .env.example .env.local
bun dev
```

Fill `.env.local` with your Supabase project URL and publishable key. `NEXT_PUBLIC_API_URL` points to the render service (http://localhost:8000 when running it with Docker Compose).

The app runs at http://localhost:3000.

## Generated types

Two files in `src/types` are generated. Don't edit them by hand.

- `api.ts` comes from the render service. Run `bun run types:api` after changing its Pydantic models (the service must be running).
- `database.ts` comes from the Supabase schema. Run `bun run types:db` after pushing a migration (needs `bunx supabase login` and a linked project).
