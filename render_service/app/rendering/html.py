from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from weasyprint import HTML

from app.core.url_fetcher import ResumeURLFetcher
from app.rendering.icons import icon
from app.rendering.styles import style_for
from app.rendering.view import SEPARATOR, build_view
from app.schemas.resume import Resume

_APP_DIR = Path(__file__).resolve().parent.parent
_STATIC_DIR = _APP_DIR / "static"
FONTS_DIR = _STATIC_DIR / "fonts"

_env = Environment(
    loader=FileSystemLoader(_APP_DIR / "templates"),
    autoescape=select_autoescape(default=True, default_for_string=True),
    undefined=StrictUndefined,
    trim_blocks=True,
    lstrip_blocks=True,
)
_env.globals["icon"] = icon


def render_html(resume: Resume) -> str:
    options = resume.options
    return _env.get_template(f"{options.template}.html").render(
        view=build_view(resume),
        style=style_for(options.template, options.color),
        separator=SEPARATOR,
    )


def _document(html: str) -> HTML:
    return HTML(
        string=html,
        base_url=f"{_STATIC_DIR.as_uri()}/",
        url_fetcher=ResumeURLFetcher(FONTS_DIR),
    )


def render_pdf(resume: Resume) -> bytes:
    return _document(render_html(resume)).write_pdf()


def render_preview(resume: Resume) -> tuple[str, int]:
    """The preview HTML and the number of pages the PDF will have.

    The browser shows the HTML as one continuous page, so the page count has to come from
    the PDF layout.
    """
    html = render_html(resume)
    return html, len(_document(html).render().pages)
