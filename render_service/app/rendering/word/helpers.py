"""python-docx helpers for features without a high-level API (hyperlinks, paragraph borders)."""

from docx.document import Document
from docx.enum.text import WD_TAB_ALIGNMENT
from docx.opc.constants import RELATIONSHIP_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from docx.text.paragraph import Paragraph
from docx.text.run import Run

from app.rendering.richtext import Paragraph as RichParagraph

# Schema order of <w:pPr> children that must follow <w:pBdr> (ECMA-376, CT_PPrBase).
_PBDR_SUCCESSORS = (
    "w:shd", "w:tabs", "w:suppressAutoHyphens", "w:kinsoku", "w:wordWrap", "w:overflowPunct",
    "w:topLinePunct", "w:autoSpaceDE", "w:autoSpaceDN", "w:bidi", "w:adjustRightInd",
    "w:snapToGrid", "w:spacing", "w:ind", "w:contextualSpacing", "w:mirrorIndents",
    "w:suppressOverlap", "w:jc", "w:textDirection", "w:textAlignment", "w:textboxTightWrap",
    "w:outlineLvl", "w:divId", "w:cnfStyle", "w:rPr", "w:sectPr", "w:pPrChange",
)  # fmt: skip


def add_text(
    paragraph: Paragraph,
    text: str,
    *,
    size_pt: float | None = None,
    bold: bool | None = None,
    italic: bool | None = None,
    color: str | None = None,
    underline: bool | None = None,
) -> Run:
    run = paragraph.add_run(text)
    font = run.font
    if size_pt is not None:
        font.size = Pt(size_pt)
    if bold is not None:
        font.bold = bold
    if italic is not None:
        font.italic = italic
    if color is not None:
        font.color.rgb = RGBColor.from_string(color)
    if underline is not None:
        font.underline = underline
    return run


def add_rich_text(paragraph: Paragraph, runs: RichParagraph, *, size_pt: float) -> None:
    for rich_run in runs:
        add_text(paragraph, rich_run.text, size_pt=size_pt, bold=rich_run.bold or None)


def add_hyperlink(
    paragraph: Paragraph, text: str, url: str, *, size_pt: float, color: str, underline: bool
) -> None:
    rel_id = paragraph.part.relate_to(url, RELATIONSHIP_TYPE.HYPERLINK, is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), rel_id)
    run = add_text(paragraph, text, size_pt=size_pt, color=color, underline=underline)
    hyperlink.append(run._r)  # moves the run from the paragraph into the hyperlink
    paragraph._p.append(hyperlink)


def set_bottom_border(paragraph: Paragraph, *, width_pt: float, color: str) -> None:
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(round(width_pt * 8)))  # eighths of a point
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), color)
    border = OxmlElement("w:pBdr")
    border.append(bottom)
    paragraph._p.get_or_add_pPr().insert_element_before(border, *_PBDR_SUCCESSORS)


def set_spacing(
    paragraph: Paragraph, *, before_pt: float = 0, after_pt: float = 0, keep_with_next: bool = False
) -> None:
    fmt = paragraph.paragraph_format
    fmt.space_before = Pt(before_pt)
    fmt.space_after = Pt(after_pt)
    if keep_with_next:
        fmt.keep_with_next = True


def add_right_tab(paragraph: Paragraph, position_in: float) -> None:
    paragraph.paragraph_format.tab_stops.add_tab_stop(Inches(position_in), WD_TAB_ALIGNMENT.RIGHT)


def set_page(
    document: Document, *, width_in: float, height_in: float, margin_x_in: float, margin_y_in: float
) -> None:
    section = document.sections[0]
    section.page_width = Inches(width_in)
    section.page_height = Inches(height_in)
    section.left_margin = section.right_margin = Inches(margin_x_in)
    section.top_margin = section.bottom_margin = Inches(margin_y_in)
