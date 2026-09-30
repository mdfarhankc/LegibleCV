# Render service

Takes resume JSON and returns an HTML preview, a PDF or a DOCX. It doesn't store anything and has no database access. Requests are authenticated with the Supabase access token.

## Endpoints

- `GET /health`
- `POST /v1/render/preview` - HTML for the live preview
- `POST /v1/render/pdf` - PDF download
- `POST /v1/render/docx` - Word download

The request body is the `Resume` model in `app/schemas/resume.py`. Full docs at `/docs` (disabled in production).

## Development

From the repo root:

```bash
docker compose up --build
docker compose run --rm render-service pytest
```

Compose runs with `AUTH_DISABLED=true`, so you don't need a token locally. That flag is rejected outside `ENVIRONMENT=development`.

Linting works outside Docker:

```bash
uv run ruff format app tests
uv run ruff check app tests
```

## Config

See `.env.example`. In production you only need `SUPABASE_URL` and `ALLOWED_ORIGINS`.

## Production

```bash
docker build --target prod -t render-service .
docker run -p 8080:8080 -e SUPABASE_URL=... -e ALLOWED_ORIGINS=... render-service
```

## Adding a template

A template has two parts that must stay in sync: `templates/<name>.html` for HTML/PDF and a builder in `app/rendering/word/` for DOCX. Both read the same view model (`rendering/view.py`) and style tokens (`rendering/styles.py`). Register the name in `ResumeOptions.template` and add it to the ordered-marker tests.

## Fonts

PDFs use Carlito, a free font with the same metrics as Calibri (license in `app/static/fonts/OFL.txt`). DOCX files use Calibri directly.
