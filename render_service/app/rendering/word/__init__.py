from io import BytesIO

import docx

from app.rendering.styles import CLASSIC
from app.rendering.view import build_view
from app.rendering.word.classic import ClassicBuilder
from app.schemas.resume import Resume

_BUILDERS = {"classic": (ClassicBuilder, CLASSIC)}


def render_docx(resume: Resume) -> bytes:
    builder_cls, style = _BUILDERS[resume.options.template]
    document = docx.Document()
    builder_cls(document, build_view(resume), style).build()
    buffer = BytesIO()
    document.save(buffer)
    return buffer.getvalue()
