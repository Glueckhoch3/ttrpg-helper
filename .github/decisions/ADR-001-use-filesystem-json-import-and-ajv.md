---
name: ADR-001
title: "Use filesystem for JSON import and AJV validation"
date: 2026-04-29
status: accepted
domain: backend
agent: GitHub Copilot
decisionBy: team
supersedes: —
supersededBy: —
---

### Context

The project needs a backend API to accept and return whole JSON documents from the frontend. During initial development we introduced several implementation choices and dependencies: storing uploaded JSON on the server filesystem, validating payloads with AJV, limiting request body size, sanitizing filenames, and adding minimal HTTP hardening (helmet). These are changes that affect architecture and dependencies and therefore require an Architectural Decision Record.

### Decision

We will persist uploaded JSON documents to a controlled server-side filesystem directory and validate incoming JSON payloads using AJV. We will enforce request body size limits, sanitize filenames with `sanitize-filename`, and add minimal HTTP security via `helmet`.

### Alternatives considered

- **Persist in an external database (SQLite / Postgres / MongoDB)** — Pros: more scalable querying, transactional guarantees. Cons: added operational complexity, configuration needed, and not required for initial iteration where whole-file persistence suffices.
- **Store raw uploaded files via multipart/form-data** — Pros: preserves original file metadata; Cons: frontend simpler to send `application/json` bodies and easier to validate schema on parsed JSON.
- **Rely on a cloud storage service (S3)** — Pros: scalable storage and durability; Cons: external credentials and infra setup beyond current project scope.

### Consequences

- ✅ Simple storage model that is easy to reason about and test locally.
- ✅ Fast to implement and matches current project needs (frontend + small team).
- ⚠️ Filesystem storage is less suitable for large-scale concurrent writes and querying; migrating to a DB or object store will require an ADR to change the storage approach.
- ⚠️ Operational considerations: backups, disk usage monitoring, and access controls must be implemented for production use.
- ❌ We trade off advanced querying and ACID guarantees for simplicity and speed of delivery.

### Affected files / areas

- `backend/app.js`
- `backend/server.js`
- `backend/config/index.js`
- `backend/package.json` (added `ajv`, `helmet`, `sanitize-filename`, `jest`, `supertest`)
- `backend/modules/importer/*` (`index.js`, `controller.js`, `service.js`, `model.js`)
- `backend/middleware/errorHandler.js`
- `backend/.env.example`
- `doc/ttrpg-API.yaml`
- `backend/__tests__/*`
