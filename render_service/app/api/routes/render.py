"""Render endpoints.

Handlers are sync `def` on purpose: WeasyPrint and python-docx are blocking and CPU-bound,
so FastAPI runs them in its threadpool instead of on the event loop.
"""

import re

from fastapi import APIRouter, Depends, Response
from fastapi.responses import HTMLResponse

from app.dependencies import get_current_user
from app.rendering.html import render_pdf, render_preview
from app.rendering.word import render_docx
from app.schemas.resume import Resume

PDF_MEDIA_TYPE = "application/pdf"
DOCX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

# Rendered resumes contain personal data; never let proxies or browsers cache them.
_NO_STORE = {"Cache-Control": "no-store"}
_AUTH_ERRORS = {401: {"description": "Missing, invalid, or expired token"}}

router = APIRouter(
    prefix="/v1/render",
    tags=["render"],
    dependencies=[Depends(get_current_user)],
    responses=_AUTH_ERRORS,
)


def download_filename(full_name: str, extension: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "-", full_name).strip("-")
    return f"{slug}-Resume.{extension}" if slug else f"Resume.{extension}"


def _attachment(content: bytes, media_type: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type=media_type,
        headers={**_NO_STORE, "Content-Disposition": f'attachment; filename="{filename}"'},
    )


PAGE_COUNT_HEADER = "X-Page-Count"


@router.post("/preview", response_class=HTMLResponse)
def preview(resume: Resume) -> HTMLResponse:
    html, page_count = render_preview(resume)
    return HTMLResponse(html, headers={**_NO_STORE, PAGE_COUNT_HEADER: str(page_count)})


@router.post(
    "/pdf",
    response_class=Response,
    responses={200: {"content": {PDF_MEDIA_TYPE: {}}, "description": "The resume as PDF"}},
)
def export_pdf(resume: Resume) -> Response:
    filename = download_filename(resume.full_name, "pdf")
    return _attachment(render_pdf(resume), PDF_MEDIA_TYPE, filename)


@router.post(
    "/docx",
    response_class=Response,
    responses={200: {"content": {DOCX_MEDIA_TYPE: {}}, "description": "The resume as DOCX"}},
)
def export_docx(resume: Resume) -> Response:
    filename = download_filename(resume.full_name, "docx")
    return _attachment(render_docx(resume), DOCX_MEDIA_TYPE, filename)
