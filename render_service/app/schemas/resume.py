from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl

from app.schemas.fields import (
    Bullets,
    Id,
    Label,
    OptionalLongText,
    OptionalPhone,
    OptionalShortText,
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


class TextSection(Model):
    type: Literal["text"] = "text"
    id: Id
    title: Label
    content: OptionalLongText = None


class EntriesSection(Model):
    type: Literal["entries"] = "entries"
    id: Id
    title: Label
    items: Annotated[list[Entry], Field(max_length=30)] = []


class SkillsSection(Model):
    type: Literal["skills"] = "skills"
    id: Id
    title: Label
    groups: Annotated[list[SkillGroup], Field(max_length=20)] = []


class BulletsSection(Model):
    type: Literal["bullets"] = "bullets"
    id: Id
    title: Label
    items: Bullets = []


class InlineSection(Model):
    type: Literal["inline"] = "inline"
    id: Id
    title: Label
    items: ShortItems = []


Section = Annotated[
    TextSection | EntriesSection | SkillsSection | BulletsSection | InlineSection,
    Field(discriminator="type"),
]


class ResumeOptions(Model):
    template: Literal["classic"] = "classic"
    ats_mode: bool = False
    page_size: Literal["A4", "Letter"] = "A4"


class Resume(Model):
    full_name: ShortText
    email: EmailStr
    phone: OptionalPhone = None
    location: OptionalShortText = None
    links: Annotated[list[Link], Field(max_length=10)] = []
    sections: Annotated[list[Section], Field(max_length=20)] = []
    options: ResumeOptions = Field(default_factory=ResumeOptions)
