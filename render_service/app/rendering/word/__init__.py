from io import BytesIO

import docx

from app.rendering.styles import CLASSIC
from app.rendering.view import build_view
from app.rendering.word.classic import ClassicBuilder
from app.schemas.resume import Resume


def render_docx(resume: Resume) -> bytes:
    # Every template gets the classic single-column document. Two columns in Word would need
    # a table, which is hard to edit and hard for parsers to read.
    document = docx.Document()
    ClassicBuilder(document, build_view(resume), CLASSIC).build()
    buffer = BytesIO()
    document.save(buffer)
    return buffer.getvalue()
