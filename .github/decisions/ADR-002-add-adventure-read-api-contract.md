---
name: ADR-002
title: "Add read-only adventure slice API using metadata.title routing"
date: 2026-05-13
status: proposed
domain: backend
agent: GitHub Copilot
decisionBy: team
supersedes: —
supersededBy: —
---

### Context

The backend currently supports only whole-document import/export endpoints and lacks dedicated read endpoints for adventure slices.  
The frontend needs direct access to adventure metadata, chapter lists, single chapters, NPC lists, and single NPCs, including counts for overview rendering.  
We also needed to decide how `/api/adventures/{adventureName}` resolves an adventure while keeping the current file-based storage model.

### Decision

Add a read-only adventure API under `/api/adventures/{adventureName}/...`, keep existing import/export endpoints, and resolve `adventureName` by matching `metadata.title` from stored JSON files.

### Alternatives considered

- **Use filename-based routing (`<adventureName>.json`)** — simpler lookup but couples public API to storage filenames and ignores domain metadata.
- **Add database-backed indexing/caching** — better lookup performance and extensibility, but introduces non-trivial architectural complexity beyond current scope.

### Consequences

- ✅ Frontend receives focused endpoints and `count + list` responses for chapters/NPCs.
- ✅ Existing API clients for `/api/import` and `/api/export` remain compatible.
- ⚠️ Title-based lookup requires scanning stored JSON files and depends on unique/stable `metadata.title` values.
- ❌ Performance is linear in stored adventure file count until a future indexing strategy is introduced.

### Affected files / areas

- `backend/app.js`
- `backend/modules/adventures/*`
- `backend/__tests__/adventures.test.js`
- `doc/ttrpg-API.yaml`
