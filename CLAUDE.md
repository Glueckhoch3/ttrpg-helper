# TTRPG Helper – working instructions for Claude

Purpose: LAN web app for a D&D group (session notes, GM-unlocked story parts, grid maps with symbols, PNG export). Plan: `docs/PLAN.md`. Decisions: `docs/decisions/_index.md` (read first; write an ADR for any real trade-off, add it to the index).

## Layout
`backend/` Express 5 ESM + node:sqlite (app.js = createApp(db), server.js = boot) · `frontend/` Vue 3 + PrimeVue + Vite · `docs/`.

## Repeatable tasks
- Install: `npm --prefix backend i && npm --prefix frontend i`
- Dev: `npm --prefix backend run dev` + `npm --prefix frontend run dev` (Vite proxies /api → :3000)
- Prod/LAN: `npm run build --prefix frontend` then `npm --prefix backend start`; backend serves `frontend/dist`, prints LAN URL + GM PIN.
- Tests: `npm --prefix backend test` (in-memory DB via `createApp(openDb(':memory:'))`). Add a test for every endpoint.
- New endpoint: route module in `backend/modules/<name>/`, tests, update `docs/PLAN.md` API list.
- Lint frontend: `npm --prefix frontend run lint`.

## Rules
- Never commit `.env`, `data/`, PIN values. Config only via env (`backend/.env.example`).
- Story secrecy is enforced in the backend (never send locked part bodies to non-GM).
- Uploads: validate magic bytes + size, never trust client filenames (stored under generated names).
- Git: user approved (2026-11-21) pushing to origin (Glueckhoch3/ttrpg-helper). Workflow: feature/dev branch, small commits bundled by topic, open a PR for the user to approve; never push to `main` directly. Old study project = commit `1610aa1` (deleted from tree).
- Colours: contrast + colour-blind rules in ADR-012 addendum (no red/green-only cues, Okabe-Ito for symbols); never hard-code in components; use `var(--app-*)` from the theme template `frontend/src/themes.js` (ADR-012).
- UI strings: English only in `frontend/src/locales/en.json`, always via `$t()`/`t()` (vue-i18n) so languages can be added by copying that file and registering it in `src/i18n.js`. Backend error messages stay English.
- Auth: group password (cookie, env GROUP_PASSWORD) gates the whole API except /health and /auth/*; GM PIN adds GM rights (ADR-009).
- Browser E2E check (not in repo): install playwright in the scratchpad, start the backend with fixed `GM_PIN`/`GROUP_PASSWORD`/fresh `DATA_DIR`/other `PORT`, drive the UI. It caught a real drag bug – repeat after map-editor changes. Don't use `pkill -f` on the node server (kills the shell); use `kill $(pgrep -f "[n]ode server.js")`.

## Open questions
None currently. (PDF export: not wanted. Languages: English first, i18n-ready.)
