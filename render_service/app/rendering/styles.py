"""Style tokens shared by the HTML/PDF and DOCX renderers of each template."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PageSize:
    width_in: float
    height_in: float
    css_name: str


PAGE_SIZES: dict[str, PageSize] = {
    "A4": PageSize(210 / 25.4, 297 / 25.4, "A4"),
    "Letter": PageSize(8.5, 11.0, "letter"),
}


@dataclass(frozen=True, slots=True)
class ClassicStyle:
    docx_font: str = "Calibri"
    # Word "multiple" spacing scales the font's own line height; CSS scales the font size.
    line_height: float = 1.15
    font_line_height_em: float = 1.2207  # Calibri/Carlito ascent + descent + line gap

    margin_y_in: float = 0.5
    margin_x_in: float = 0.6
    bullet_indent_in: float = 0.25

    name_pt: float = 22
    contact_pt: float = 9.5
    heading_pt: float = 12
    entry_title_pt: float = 10.5
    body_pt: float = 10
    meta_pt: float = 9.5

    text_color: str = "000000"
    link_color: str = "0046B4"
    muted_color: str = "646464"

    name_after_pt: float = 2
    contact_after_pt: float = 2
    heading_before_pt: float = 8
    heading_after_pt: float = 4
    heading_border_pt: float = 0.5
    entry_before_pt: float = 6
    line_after_pt: float = 1
    bullet_gap_pt: float = 1
    paragraph_after_pt: float = 4

    @property
    def css_line_height(self) -> float:
        return round(self.line_height * self.font_line_height_em, 3)

    def link(self, ats_mode: bool) -> str:
        return self.text_color if ats_mode else self.link_color

    def muted(self, ats_mode: bool) -> str:
        return self.text_color if ats_mode else self.muted_color

    def content_width_in(self, page: PageSize) -> float:
        return page.width_in - 2 * self.margin_x_in


CLASSIC = ClassicStyle()


@dataclass(frozen=True, slots=True)
class SidePanelStyle:
    """Tinted left panel with a colored cap for the name."""

    font: str = "Carlito"
    margin_y_in: float = 0.5
    panel_width_pct: int = 33
    panel_pad_in: float = 0.3
    main_pad_left_in: float = 0.4
    main_pad_right_in: float = 0.5

    panel_color: str = "eef0f6"
    cap_color: str = "0d1746"
    accent_color: str = "1c3faa"
    text_color: str = "16181d"
    muted_color: str = "5a6072"
    rule_color: str = "c9cdd8"

    body_pt: float = 9.5
    name_pt: float = 16
    heading_pt: float = 13.5
    small_pt: float = 8.5
    line_height: float = 1.38


@dataclass(frozen=True, slots=True)
class BannerStyle:
    """Dark band across the top, wide main column, narrow side column."""

    font: str = "Poppins"
    margin_y_in: float = 0.5
    side_width_pct: int = 32
    edge_pad_in: float = 0.55
    gutter_in: float = 0.32

    band_color: str = "2e3443"
    band_text_color: str = "ffffff"
    band_muted_color: str = "c3c8d4"
    text_color: str = "1b1d22"
    muted_color: str = "7b808c"
    rule_color: str = "d9dce3"

    body_pt: float = 9
    name_pt: float = 25
    heading_pt: float = 14.5
    small_pt: float = 8
    line_height: float = 1.45


SIDE_PANEL = SidePanelStyle()
BANNER = BannerStyle()
