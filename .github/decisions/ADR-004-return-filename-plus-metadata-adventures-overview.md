---
name: ADR-004
title: "Return filename-plus-metadata adventures overview"
date: 2026-05-29
status: accepted
domain: backend
agent: GitHub Copilot
decisionBy: team
supersedes: ADR-003
supersededBy: —
---

### Context

The global adventures endpoint needs to expose each discovered adventure's source filename together with its metadata so clients can identify and render entries deterministically. The previous response shape only returned metadata objects, which lost the filesystem identity for each adventure and forced clients to infer identity from metadata content. This is a public API contract change that affects backend, frontend, and documentation.

### Decision

`GET /api/adventures` will return `{ adventures: [{ filename, metadata }] }` where `filename` is the discovered JSON filename and `metadata` is the parsed adventure metadata object.

### Alternatives considered

- **Keep returning `{ count, metadata }`** — simpler for the current UI, but it discards filename identity and cannot satisfy clients that need the source filename.
- **Return only filenames** — preserves identity, but clients would need extra round trips to fetch metadata for each adventure.

### Consequences

- ✅ Clients can display and key adventure entries with stable filename identity.
- ✅ The backend keeps malformed JSON skipping behavior while exposing all valid files found on disk.
- ⚠️ This is a breaking change for any client still expecting top-level `count` and `metadata` fields.
- ❌ The overview response is no longer a lightweight metadata-only list.

### Affected files / areas

- `backend/modules/adventures/model.js`
- `backend/modules/adventures/service.js`
- `backend/__tests__/adventures.test.js`
- `frontend/src/views/AdventureOverview.vue`
- `doc/ttrpg-API.yaml`
- `.github/decisions/_index.md`