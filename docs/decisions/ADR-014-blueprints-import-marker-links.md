# ADR-014 Blueprints, import menu, marker links (issue #4)

Status: accepted

## Context
The GM wants to upload public item and creature data and attach it to map symbols. Players should see it in a sidebar with collapsible bars. Spell descriptions follow later (issue "Improved Maps#5").

## Decisions
- **Blueprints**: one table `blueprints(kind, name, subtitle, body, stats JSON, source)`; `kind` is `item` or `creature` (`KINDS` in `lib/blueprints.js`; add `spell` there later, no migration). Stats are a list of `{title, value}` (max 40) so any game system fits; a fixed D&D schema was rejected as too narrow for the three import formats.
- **Import menu = importer registry** (`lib/importers/index.js`, max. three entries as requested): `open5e` (Open5e API JSON, SRD), `5etools` (5etools data files), `ttrpg` (own simple format, see `docs/import-formats.md`; the escape hatch for any other source). An importer is a pure function `parse(data, kind) -> raw entries`; shared validation is `cleanBlueprint(..., {lenient:true})`, which clips/drops junk instead of failing the whole file. The frontend menu is generated from `GET /import/formats`, so adding a format or the `spell` kind needs no frontend change.
- **No network access**: the GM uploads a file; the server never fetches URLs (no SSRF, works offline in a LAN). Source licences are the GM's responsibility; the UI says so for 5etools.
- **Two stateless steps**: `POST /import/preview` (what is in the file, which names already exist) and `POST /import` (re-parses, stores the chosen `indexes`, skips same kind+name case-insensitively, max 1000 per call, one transaction). The import routes parse their own JSON body (15 MB) *after* the GM check; the global parser skips `/api/import` and keeps 1 MB elsewhere.
- **Marker links**: `tokens.npc_id` (0..1), `tokens.creature_id` (0..1, kind creature) and `token_items` (0..5, kind item, ordered), the limits from the issue, enforced in `lib/tokenLinks.js`. Links are set only by the GM (403 otherwise); deleting a blueprint/NPC clears its links (FK `SET NULL` / `CASCADE`). Token responses carry `npc`, `creature`, `items` as `{id,name}` only; details are loaded when a bar is opened.
- **Secrecy**: the blueprint library list and write routes are GM only. A player may `GET /blueprints/:id` only while it is linked to a marker on an *unlocked* map; the GM's link is the reveal. **Amends ADR-013**: an NPC is also readable by players when linked to a marker on an unlocked map (same public fields as before).
- **Rendering**: all imported text is shown as plain text (Vue interpolation); 5etools `{@tag}` markup is stripped on import.

## Consequences
Blueprints are copies, not live links to the source; re-importing skips existing names (delete first to refresh). Linking is per marker; "apply to all markers with this label" is not included.
