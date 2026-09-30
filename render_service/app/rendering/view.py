"""Format-independent view of a resume.

Both renderers consume this, so content decisions (what text appears, in which order, which
parts are omitted) are made once and the HTML/PDF and DOCX outputs cannot drift apart.
"""

from dataclasses import dataclass
from typing import ClassVar

from pydantic import HttpUrl

from app.rendering.richtext import Paragraph, parse_paragraphs, parse_runs
from app.rendering.styles import PAGE_SIZES, PageSize
from app.schemas.resume import (
    BulletsSection,
    EntriesSection,
    Entry,
    InlineSection,
    Link,
    Resume,
    Section,
    SkillsSection,
    TextSection,
)

SEPARATOR = "  |  "


@dataclass(frozen=True, slots=True)
class LinkText:
    text: str
    url: str | None = None


@dataclass(frozen=True, slots=True)
class EntryView:
    title: str
    title_right: str | None
    subtitle: str | None
    subtitle_right: str | None
    meta: str | None
    link: LinkText | None
    description: list[Paragraph]
    bullets: list[Paragraph]

    @property
    def has_subtitle_line(self) -> bool:
        return bool(self.subtitle or self.subtitle_right)


@dataclass(frozen=True, slots=True)
class TextBlock:
    kind: ClassVar[str] = "text"
    paragraphs: list[Paragraph]


@dataclass(frozen=True, slots=True)
class EntriesBlock:
    kind: ClassVar[str] = "entries"
    entries: list[EntryView]


@dataclass(frozen=True, slots=True)
class SkillsBlock:
    kind: ClassVar[str] = "skills"
    groups: list[tuple[str, str]]


@dataclass(frozen=True, slots=True)
class BulletsBlock:
    kind: ClassVar[str] = "bullets"
    items: list[Paragraph]


@dataclass(frozen=True, slots=True)
class InlineBlock:
    kind: ClassVar[str] = "inline"
    items: list[str]


type Block = TextBlock | EntriesBlock | SkillsBlock | BulletsBlock | InlineBlock


@dataclass(frozen=True, slots=True)
class SectionView:
    title: str
    block: Block


@dataclass(frozen=True, slots=True)
class ResumeView:
    full_name: str
    contact: list[LinkText]
    sections: list[SectionView]
    ats_mode: bool
    page: PageSize

    @property
    def document_title(self) -> str:
        return f"{self.full_name} - Resume"


def url_text(url: HttpUrl) -> str:
    text = str(url)
    return text.removesuffix("/") if url.path in (None, "/") else text


def date_range(entry: Entry) -> str | None:
    end = "Present" if entry.is_current else entry.end
    if entry.start and end:
        return f"{entry.start} - {end}"
    return entry.start or end


def _entry_view(entry: Entry) -> EntryView:
    dates = date_range(entry)
    # With a location, dates move to the subtitle line so both fit on the right edge.
    title_right, subtitle_right = (entry.location, dates) if entry.location else (dates, None)
    return EntryView(
        title=entry.title,
        title_right=title_right,
        subtitle=entry.subtitle,
        subtitle_right=subtitle_right,
        meta=entry.meta,
        link=_entry_link(entry.link),
        description=parse_paragraphs(entry.description),
        bullets=[parse_runs(bullet) for bullet in entry.bullets],
    )


def _entry_link(link: Link | None) -> LinkText | None:
    if link is None:
        return None
    url = url_text(link.url)
    return LinkText(f"{link.label}: {url}", url)


def _block(section: Section) -> Block | None:
    match section:
        case TextSection(content=content):
            paragraphs = parse_paragraphs(content)
            return TextBlock(paragraphs) if paragraphs else None
        case EntriesSection(items=items):
            return EntriesBlock([_entry_view(item) for item in items]) if items else None
        case SkillsSection(groups=groups):
            rows = [(group.label, ", ".join(group.items)) for group in groups if group.items]
            return SkillsBlock(rows) if rows else None
        case BulletsSection(items=items):
            return BulletsBlock([parse_runs(item) for item in items]) if items else None
        case InlineSection(items=items):
            return InlineBlock(list(items)) if items else None


def _contact(resume: Resume) -> list[LinkText]:
    items: list[LinkText] = []
    if resume.location:
        items.append(LinkText(resume.location))
    items.append(LinkText(resume.email, f"mailto:{resume.email}"))
    if resume.phone:
        items.append(LinkText(resume.phone))
    for link in resume.links:
        url = url_text(link.url)
        # ATS parsers often drop hyperlink targets, so print the URL itself.
        items.append(LinkText(url if resume.options.ats_mode else link.label, url))
    return items


def build_view(resume: Resume) -> ResumeView:
    sections = [
        SectionView(section.title.upper(), block)
        for section in resume.sections
        if (block := _block(section)) is not None
    ]
    return ResumeView(
        full_name=resume.full_name,
        contact=_contact(resume),
        sections=sections,
        ats_mode=resume.options.ats_mode,
        page=PAGE_SIZES[resume.options.page_size],
    )
