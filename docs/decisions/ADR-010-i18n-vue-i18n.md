---
name: ADR-010
status: accepted
date: 2026-11-21
---
# ADR-010: vue-i18n with English as the only shipped language

All UI strings live in `frontend/src/locales/en.json`. Add a language by copying the file and registering it in `src/i18n.js` (locale is read from localStorage `ttrpg.lang`; a language switcher UI is not built yet). Backend messages stay English.
