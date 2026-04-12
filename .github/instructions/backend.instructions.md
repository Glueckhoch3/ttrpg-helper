---
name: backend.instructions
description: "Use when: backend API, server code, environment variables, authentication, and logging (applyTo: backend/**)."
applyTo: "backend/**"
visibility: public
---

**Maintainer:** Backend team
**Purpose:** Rules and guardrails for backend development and API design.

Security & secrets

- Never include secrets, keys, or tokens in code or in assistant responses.
- Use `.env` or platform secret stores; commit only `.env.example`.
- Use placeholder values in `.env.example` and make them obvious with CAPS.

API contracts

- Keep route handlers small and documented; update API docs when changing endpoints.
- Return clear HTTP status codes and error payloads.
- Document any API changes in the ttrpg-API.yaml file at `doc/ttrpg-API.yaml` and check when creating a PR if the API documentation matches the actual API. 

Data storage

- Document and reference the database model at `doc/ttrpg-database.json` to keep Data variable names and the data structure consistent over the whole application.

Testing & logging

- Add unit and integration tests for new endpoints.
- Log structured events; avoid logging secrets.

Error handling

- Use consistent error shapes and do not leak stack traces to clients.

Architectural decisions

- Read `decisions/_index.md` before designing a new endpoint or data model.
- Common past decisions to check: auth strategy, pagination, error format, soft-delete policy.
- Write an ADR when introducing a new library, changing the DB schema in a breaking way,
  or choosing between two real architectural approaches.
