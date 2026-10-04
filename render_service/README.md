# Render service

Takes resume JSON and returns an HTML preview, a PDF or a DOCX. It doesn't store anything and has no database access. Requests are authenticated with the Supabase access token.

FastAPI, with WeasyPrint for PDFs and python-docx for Word files.

## Endpoints

- `GET /health`
- `POST /v1/render/preview` - HTML for the live preview. The `X-Page-Count` header says how many pages the PDF will have.
- `POST /v1/render/pdf` - PDF download
- `POST /v1/render/docx` - Word download

The request body is the `Resume` model in `app/schemas/resume.py`. A photo is sent inside it as a base64 JPEG (at most 300 KB), never as a link. Full docs at `/docs` (disabled in production).

## Development

From the repo root:

```bash
docker compose up --build
docker compose run --rm render-service pytest
```

Compose runs with `AUTH_DISABLED=true`, so you don't need a token locally. That flag is rejected outside `ENVIRONMENT=development`.

The container reloads when you change a file.

Linting works outside Docker:

```bash
uv run ruff format app tests
uv run ruff check app tests
```

## Config

See `.env.example`. In production you need `SUPABASE_URL`, which is where the service fetches the keys to verify tokens.

Each user gets `RATE_LIMIT_PER_MINUTE` render requests a minute (60 by default) and bodies over `MAX_BODY_BYTES` are refused. The count is kept in memory, so it is per instance.

`ALLOWED_ORIGINS` only matters if a browser calls the service directly. The web app calls it from its own server, so it can stay empty there.

## Production

```bash
docker build --target prod -t render-service .
docker run -p 8080:8080 -e SUPABASE_URL=... render-service
```

## Templates

- `classic` - one column. The only template with an ATS mode.
- `sidepanel` - a tinted left panel with the name on top. Prints the photo if there is one.
- `banner` - a dark band across the top and a narrow right column. Prints the photo if there is one.

On the two-column templates, each section goes to the main or side column by its `placement`. `auto` puts skills, bullet lists and one-line lists in the side column, and text and entries in the main one.

The two-column templates also take a color (`options.color`, one of the names in `PALETTES` in `rendering/styles.py`) and print an icon beside each contact line. The icons are inline SVG from `rendering/icons.py`.

The Word file is always the classic single-column layout, whatever the template. The web app only offers it for Classic.

To add a template:

1. Put the name in `Template` in `app/schemas/resume.py`.
2. Add a style class in `rendering/styles.py`.
3. Add `templates/<name>.html`. Two-column templates can reuse the blocks in `templates/_blocks.html`.
4. Register the style in `rendering/html.py`.
5. Add it to the tests in `tests/test_templates.py`.

## How rendering is organized

`rendering/view.py` turns a resume into a view model: what text appears, in what order, which empty parts are left out. The HTML templates and the DOCX builder both read from it, so the PDF and the Word file can't disagree about content.

User text is escaped by Jinja2 and never treated as HTML. Bullets and descriptions support `**bold**` and nothing else.

WeasyPrint fetches every URL a document references. The service gives it a fetcher that only serves the bundled font files and the photo embedded in the request, so a resume can't make the server request anything else.

## Fonts

Bundled in `app/static/fonts`, both under the SIL Open Font License:

- Carlito (classic, sidepanel) - same metrics as Calibri. DOCX files use Calibri directly.
- Poppins (banner).

The contact icons are from [Lucide](https://lucide.dev). Its license is in `app/static/icons`.
