# TTRPG Helper – Plan (v2 rewrite)

Goal: a D&D group in one private network (WLAN) shares session notes, a GM pre-creates story parts and unlocks them step by step, and everyone works on a shared grid map with symbols, elevation numbers and export.

## Exploration result (old project)
Vue 3 + Vite + PrimeVue frontend, Express 5 (ESM) + AJV + Jest backend. It was an *adventure JSON editor* (single user, JSON files, no auth, no realtime, no DB). Domain code does not fit the new goal; tooling does. Old material was removed; it lives in commit `1610aa1`.

**Decision: keep the stack and tooling, replace the domain.** See ADR-005..008.

## Architecture
- `backend/` Express 5, ESM, `node:sqlite` (no native deps), SSE for live updates, binary image upload via `express.raw` (magic-byte checked). Serves built frontend in production → one process, one port, reachable at `http://<host-ip>:3000` in the WLAN.
- `frontend/` Vue 3 + PrimeVue + vue-router. Map editor is plain SVG (no canvas lib).
- Looks: `frontend/src/themes.js` template, ADR-012; own CSS uses `var(--app-*)` only (see CLAUDE.md).
- Auth: players join with a name + shared group password (ADR-009; HttpOnly cookie). GM unlocks with a PIN (env `GM_PIN`, auto-generated + printed at start when unset) → bearer token. Server enforces: locked story parts are never sent to players.

## Data model (SQLite)
sessions(id, number, title, played_on, summary) · notes(id, session_id, author, body, created_at, updated_at) · story_parts(id, position, title, body, unlocked, unlocked_at) · maps(id, title, image_file, img_w, img_h, grid_type[square|hex|none], cell_px, offset_x, offset_y, session_id) · tokens(id, map_id, symbol, label, color, col, row, elevation, size, note) · attachments(id, session_id, kind, file, title, created_at)

## API (all JSON under /api unless noted)
- `POST /auth/join {password}` (sets cookie) · `POST /auth/leave` · `GET /auth/me` · `POST /auth/gm {pin}` → `{token}` · `GET /health` · `GET /events` (SSE). All other routes need the member cookie or GM token.
- Sessions: `GET/POST /sessions`, `GET/PATCH/DELETE /sessions/:id`; notes: `GET/POST /sessions/:id/notes`, `PATCH/DELETE /notes/:id`; `GET/POST /sessions/:id/attachments` (raw PNG/PDF), `GET /files/:name`
- Story (GM write; players only ever see unlocked parts, locked ones are 404/omitted): `GET/POST /story`, `PATCH/DELETE /story/:id`, `POST /story/:id/unlock|lock`, `POST /story/reorder`
- Maps: `GET/POST /maps` (raw image upload, `?title=`), `GET/PATCH/DELETE /maps/:id`; tokens `GET/POST /maps/:id/tokens`, `PATCH/DELETE /tokens/:id`

## Frontend views
Join · Sessions (list + detail with notes & attachments) · Story (player: unlocked list; GM: editor + unlock toggles) · Maps (list/upload) · MapView (SVG: image, grid, calibration, symbol palette, drag, edit panel, export).

## Map details
- Workflow: define grid first, then lock (ADR-011); symbols only while locked.
- Grid `square` or `hex` (pointy-top, odd-r offset coords). `cell_px` = cell size in image pixels, `offset_x/y` shift; GM/players calibrate with sliders so grid fits the picture ("size" of picture ↔ net).
- Token: symbol (emoji/preset set: creature, object, landmark, hazard…), label, color, `elevation` integer (+ above / − beneath, shown as small badge, 0 hidden), size 1–3 cells, free note. Editable at any time, drag to move (snaps to cell).
- Export: render SVG → canvas → **PNG** (ADR-008), download and/or "attach to session" (stored as attachment so it appears in the session notes). PDF can be added later via print-to-PDF.

## Status
Phases 0-5 implemented (2026-11-21), plus group password, i18n and symbol-stack cycling. Backend: 15 passing tests. Frontend lints/builds clean and was verified with a headless-browser run (join, notes, map, drag, stack cycling, hex grid, PNG export/attach/remove, GM login, live unlock).

## Phases
0 Setup (this doc, CLAUDE.md, ADRs, scaffolding, tooling) → 1 Backend core + tests → 2 Frontend shell, join, sessions/notes → 3 Story parts + GM → 4 Maps/grid/tokens → 5 Export + attach → 6 Polish, README, LAN run docs.

## Open questions for the user
See bottom of `CLAUDE.md` ("Open questions").
