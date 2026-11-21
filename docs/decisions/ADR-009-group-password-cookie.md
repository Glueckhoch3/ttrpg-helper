---
name: ADR-009
status: accepted
date: 2026-11-21
---
# ADR-009: Shared group password with HttpOnly member cookie

Amends ADR-007 (players are no longer name-only). Players enter a name and the group password (`GROUP_PASSWORD`, else generated once and printed). The server sets an HttpOnly SameSite=Lax cookie holding an HMAC of a DB-persisted secret; all routes except `/health` and `/auth/*` require it. A cookie (not a bearer header) is used so `<img>`, files and `EventSource` work without custom headers. GM PIN still yields a separate bearer token. No HTTPS on the LAN: the password travels in clear text inside the trusted WLAN – acceptable for this scope.
