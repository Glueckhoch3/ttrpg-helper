# TTRPG Helper

LAN web app for a D&D group: shared session notes, GM-unlocked story parts, grid maps with symbols/elevation and PNG export.

## Run in your WLAN
```
npm --prefix backend i && npm --prefix frontend i
npm --prefix frontend run build
npm --prefix backend start      # prints GM PIN, group password + http://<ip>:3000 for the group
```
Players open the URL, enter a name and the group password (printed at start; set `GROUP_PASSWORD` to choose it). If several URLs are printed, the PC has several network adapters (e.g. WLAN + LAN) – any reachable one works. The GM clicks "GM login" and enters the PIN (set `GM_PIN` in `backend/.env`, see `.env.example`). Data lives in `backend/data/`.
The host firewall must allow the port (default 3000) for the local network.

Dev: `npm --prefix backend run dev` and `npm --prefix frontend run dev`. Tests: `npm --prefix backend test`.
Docs: `docs/PLAN.md`, `docs/decisions/`, `CLAUDE.md`.
