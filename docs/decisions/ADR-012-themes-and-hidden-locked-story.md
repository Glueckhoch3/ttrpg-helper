---
name: ADR-012
status: accepted
date: 2026-11-21
---
# ADR-012: Theme template and fully hidden locked story parts

**Story:** supersedes the "title visible" part of ADR-007. For non-GM users locked parts do not exist: `GET /story` omits them, `GET /story/:id` is 404. Players learn about a part only when it is unlocked (live via SSE).

**Themes:** `frontend/src/themes.js` is the template. One entry = one look (dark flag, PrimeVue primary/surface palette names, optional contrast `shift`, app CSS variables `--app-*`). `applyTheme` sets `app-dark` on `<html>` (PrimeVue `darkModeSelector`) and overrides `--p-primary-*`/`--p-surface-*` to point at PrimeVue's primitive palettes, so no component needs per-theme CSS. Own CSS must use `var(--app-*)`, never hard-coded colours (map symbol colours excepted). Shipped: Auto (follows OS), Daylight, Parchment (light); Midnight, Dungeon, Forest (dark). The choice is per browser (localStorage `ttrpg.theme`), not shared with the group. To add a look: add an entry + `theme.<id>` string in `locales/en.json`.

## Addendum: contrast and colour-blind accessibility (2026-11-21)
Rules for every look (verified in a headless browser by computing WCAG ratios per theme; all text and button labels >= 4.5:1, body text >= 15:1 in the normal looks, form field borders >= 4.9:1):
- Stronger separation of chrome and content: page background differs clearly from panels, 3px accent line under the nav bar, panel borders >= 3:1 against the page, visible `:focus-visible` outline.
- No information by red/green alone: accents are blue/orange/yellow; lock/unlock uses icons + labels (no green "success" buttons); danger text is red but always has a text label; elevation uses a +/- sign plus blue vs brown badge; map symbols differ by glyph, not only colour.
- Symbol colour choices are the Okabe-Ito colour-blind-safe palette (+ black/white); backend default colour is `#D55E00`.
- Grid lines are drawn with a light halo and a dark line so they remain visible on dark and light maps.
- Looks: Daylight, Parchment, Midnight, Dungeon, plus two High-contrast looks (light/dark, 2px black/white borders). "Auto" follows OS dark mode and `prefers-contrast: more`. The earlier green "Forest" look was dropped.
- Deuteranopia was checked by rendering the map page through an SVG colour-matrix filter.
