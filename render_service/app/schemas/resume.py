from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl

from app.schemas.fields import (
    Bullets,
    Id,
    Label,
    OptionalLongText,
    OptionalPhone,
    OptionalShortText,
    Photo,
    ShortItems,
    ShortText,
)


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Link(Model):
    label: Label
    url: HttpUrl


class Entry(Model):
    """A job, project, degree, award, or any other dated item."""

    title: ShortText
    subtitle: OptionalShortText = None
    location: OptionalShortText = None
    start: OptionalShortText = None
    end: OptionalShortText = None
    is_current: bool = False
    meta: OptionalShortText = None
    link: Link | None = None
    description: OptionalLongText = None
    bullets: Bullets = []


class SkillGroup(Model):
    label: Label
    items: ShortItems = []


Placement = Literal["auto", "main", "side"]


class SectionBase(Model):
    id: Id
    title: Label
    # Which column the section goes in on two-column templates. Classic ignores it.
    placement: Placement = "auto"


class TextSection(SectionBase):
    type: Literal["text"] = "text"
    content: OptionalLongText = None


class EntriesSection(SectionBase):
    type: Literal["entries"] = "entries"
    items: Annotated[list[Entry], Field(max_length=30)] = []


class SkillsSection(SectionBase):
    type: Literal["skills"] = "skills"
    groups: Annotated[list[SkillGroup], Field(max_length=20)] = []


class BulletsSection(SectionBase):
    type: Literal["bullets"] = "bullets"
    items: Bullets = []


class InlineSection(SectionBase):
    type: Literal["inline"] = "inline"
    items: ShortItems = []


Section = Annotated[
    TextSection | EntriesSection | SkillsSection | BulletsSection | InlineSection,
    Field(discriminator="type"),
]


Template = Literal["classic", "sidepanel", "banner"]
# "default" is each template's own color. The names are defined in rendering/styles.py.
Color = Literal["default", "navy", "slate", "teal", "forest", "maroon", "plum"]


class ResumeOptions(Model):
    template: Template = "classic"
    # Only the two-column templates have a color.
    color: Color = "default"
    # Plain text and printed link addresses. Only the classic template has an ATS variant.
    ats_mode: bool = False
    page_size: Literal["A4", "Letter"] = "A4"


class Resume(Model):
    full_name: ShortText
    email: EmailStr
    phone: OptionalPhone = None
    location: OptionalShortText = None
    # A JPEG data URI. Printed by the two-column templates only.
    photo: Photo | None = None
    links: Annotated[list[Link], Field(max_length=10)] = []
    sections: Annotated[list[Section], Field(max_length=20)] = []
    options: ResumeOptions = Field(default_factory=ResumeOptions)
