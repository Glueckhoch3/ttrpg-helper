---
name: ADR-012
status: accepted
date: 2026-11-21
---
# ADR-012: Theme template and fully hidden locked story parts

**Story:** supersedes the "title visible" part of ADR-007. For non-GM users locked parts do not exist: `GET /story` omits them, `GET /story/:id` is 404. Players learn about a part only when it is unlocked (live via SSE).

**Themes:** `frontend/src/themes.js` is the template. One entry = one look (dark flag, PrimeVue primary/surface palette names, optional contrast `shift`, app CSS variables `--app-*`). `applyTheme` sets `app-dark` on `<html>` (PrimeVue `darkModeSelector`) and overrides `--p-primary-*`/`--p-surface-*` to point at PrimeVue's primitive palettes, so no component needs per-theme CSS. Own CSS must use `var(--app-*)`, never hard-coded colours (map symbol colours excepted). Shipped: Auto (follows OS), Daylight, Parchment (light); Midnight, Dungeon, Forest (dark). The choice is per browser (localStorage `ttrpg.theme`), not shared with the group. To add a look: add an entry + `theme.<id>` string in `locales/en.json`.
