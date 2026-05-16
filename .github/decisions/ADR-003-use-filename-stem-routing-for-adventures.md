---
name: ADR-003
title: "Use filename-stem routing for adventure read endpoints and add global metadata overview"
date: 2026-05-16
status: accepted
domain: backend
agent: GitHub Copilot
decisionBy: team
supersedes: ADR-002
supersededBy: —
---

### Context

Adventure read endpoints were resolving files via `metadata.title`, which required scanning all uploaded JSON files and depended on title uniqueness.  
The API now needs a global adventures endpoint that returns total count plus metadata objects for all adventures in the designated upload folder.  
We need deterministic, direct lookup behavior for single-adventure endpoints while preserving secure file access constraints.

### Decision

Resolve `/api/adventures/{adventureFile}/...` by filename stem (without `.json`) and add `GET /api/adventures` to return `{ count, metadata[] }`, skipping malformed JSON files in the global overview.

### Alternatives considered

- **Keep metadata.title routing** — preserves domain naming but keeps linear scan lookup and ambiguity when titles collide.
- **Expose full filenames including `.json` in route** — simpler mapping but leaks storage extension details into API URLs.

### Consequences

- ✅ Adventure slice endpoints perform direct file resolution with predictable behavior.
- ✅ New overview endpoint provides aggregate metadata needed by clients.
- ✅ Malformed JSON files do not break global overview responses.
- ⚠️ Public API is now intentionally coupled to filename stems, requiring a hard client update.

### Affected files / areas

- `backend/modules/adventures/*`
- `backend/__tests__/adventures.test.js`
- `doc/ttrpg-API.yaml`
- `.github/decisions/_index.md`
- `.github/decisions/ADR-002-add-adventure-read-api-contract.md`
