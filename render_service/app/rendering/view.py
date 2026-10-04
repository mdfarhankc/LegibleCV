"""Format-independent view of a resume.

Both renderers consume this, so content decisions (what text appears, in which order, which
parts are omitted) are made once and the HTML/PDF and DOCX outputs cannot drift apart.
"""

from dataclasses import dataclass
from typing import ClassVar

from pydantic import HttpUrl

from app.rendering.icons import ContactKind
from app.rendering.richtext import Paragraph, parse_paragraphs, parse_runs
from app.rendering.styles import PAGE_SIZES, PageSize
from app.schemas.resume import (
    BulletsSection,
    DetailsSection,
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
class ContactItem(LinkText):
    # Picks the icon in the two-column templates.
    kind: ContactKind = "link"


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
    # Unarranged, for templates that lay the entry out differently from classic.
    location: str | None
    dates: str | None

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
    """Label and text pairs. Skill groups and personal details both print this way."""

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
    # Uppercased, as classic and the DOCX print it.
    title: str
    # As the user typed it.
    heading: str
    block: Block
    # Side column on two-column templates.
    side: bool


@dataclass(frozen=True, slots=True)
class ResumeView:
    full_name: str
    contact: list[ContactItem]
    sections: list[SectionView]
    ats_mode: bool
    photo: str | None
    page: PageSize

    @property
    def main_sections(self) -> list[SectionView]:
        return [section for section in self.sections if not section.side]

    @property
    def side_sections(self) -> list[SectionView]:
        return [section for section in self.sections if section.side]

    @property
    def document_title(self) -> str:
        return f"{self.full_name} - Resume"


def url_text(url: HttpUrl) -> str:
    text = str(url)
    return text.removesuffix("/") if url.path in (None, "/") else text


def short_url(url: HttpUrl) -> str:
    """The address as people write it: no scheme, no leading www."""
    return url_text(url).split("://", 1)[-1].removeprefix("www.")


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
        location=entry.location,
        dates=dates,
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
        case DetailsSection(items=items):
            return SkillsBlock([(item.label, item.value) for item in items]) if items else None
        case BulletsSection(items=items):
            return BulletsBlock([parse_runs(item) for item in items]) if items else None
        case InlineSection(items=items):
            return InlineBlock(list(items)) if items else None


# Short lists read well in a narrow column; long prose and dated entries need the wide one.
_SIDE_BY_DEFAULT = (SkillsSection, DetailsSection, BulletsSection, InlineSection)


def _is_side(section: Section) -> bool:
    if section.placement == "auto":
        return isinstance(section, _SIDE_BY_DEFAULT)
    return section.placement == "side"


def _contact(resume: Resume, *, print_addresses: bool) -> list[ContactItem]:
    items: list[ContactItem] = []
    if resume.location:
        items.append(ContactItem(resume.location, kind="location"))
    items.append(ContactItem(resume.email, f"mailto:{resume.email}", "email"))
    if resume.phone:
        items.append(ContactItem(resume.phone, kind="phone"))
    for link in resume.links:
        # ATS parsers often drop hyperlink targets, so the address is printed as text there.
        # The two-column templates list contact details one per line, where a bare label
        # ("LinkedIn") says nothing, so they print the address too.
        text = short_url(link.url) if print_addresses else link.label
        items.append(ContactItem(text, url_text(link.url), "link"))
    return items


def build_view(resume: Resume) -> ResumeView:
    classic = resume.options.template == "classic"
    # Only classic has an ATS variant.
    ats_mode = resume.options.ats_mode and classic
    sections = [
        SectionView(section.title.upper(), section.title, block, _is_side(section))
        for section in resume.sections
        if (block := _block(section)) is not None
    ]
    return ResumeView(
        full_name=resume.full_name,
        contact=_contact(resume, print_addresses=ats_mode or not classic),
        sections=sections,
        ats_mode=ats_mode,
        photo=None if classic else resume.photo,
        page=PAGE_SIZES[resume.options.page_size],
    )
