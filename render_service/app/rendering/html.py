from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from weasyprint import HTML

from app.core.url_fetcher import FontOnlyURLFetcher
from app.rendering.styles import CLASSIC
from app.rendering.view import SEPARATOR, build_view
from app.schemas.resume import Resume

_APP_DIR = Path(__file__).resolve().parent.parent
_STATIC_DIR = _APP_DIR / "static"
FONTS_DIR = _STATIC_DIR / "fonts"

_TEMPLATE_STYLES = {"classic": CLASSIC}

_env = Environment(
    loader=FileSystemLoader(_APP_DIR / "templates"),
    autoescape=select_autoescape(default=True, default_for_string=True),
    undefined=StrictUndefined,
    trim_blocks=True,
    lstrip_blocks=True,
)


def render_html(resume: Resume) -> str:
    template_name = resume.options.template
    return _env.get_template(f"{template_name}.html").render(
        view=build_view(resume),
        style=_TEMPLATE_STYLES[template_name],
        separator=SEPARATOR,
    )


def render_pdf(resume: Resume) -> bytes:
    document = HTML(
        string=render_html(resume),
        base_url=f"{_STATIC_DIR.as_uri()}/",
        url_fetcher=FontOnlyURLFetcher(FONTS_DIR),
    )
    return document.write_pdf()
