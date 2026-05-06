---
name: ADR-000
title: "Use JSON file storage for import test data"
date: 2026-05-06
status: accepted
domain: backend
agent: user-agent
decisionBy: team
supersedes: —
supersededBy: —
---

### Context

We need a simple, human-readable format for test import fixtures and small persisted state used by the importer.

### Decision

Store test import fixtures in JSON files under `doc/` and `backend/uploads/` to keep fixtures simple and editable.

### Alternatives considered

- **Use SQLite** — usable but adds dependency and maintenance overhead.
- **Use YAML** — human-friendly but less consistent with existing JSON fixtures.

### Consequences

- ✅ Easy to read and edit fixtures
- ⚠️ Not suitable for large-scale data
- ❌ No ACID guarantees for concurrent writes

### Affected files / areas

- backend/modules/importer/
- doc/
