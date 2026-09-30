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
