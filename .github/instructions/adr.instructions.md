---
name: adr.instructions
description: "Use when: writing, updating, or reading architectural decision records. Use when starting any non-trivial task to check existing decisions."
applyTo: ".github/decisions/**"
visibility: public
---

**Maintainer:** Team  
**Purpose:** Template, rules, and workflow for architectural decision records.

## When to write an ADR

Write one when you:

- Choose between two or more real implementation approaches
- Add a new dependency to the project
- Define a data model, API contract, or global pattern from scratch
- Make a decision a future agent might unknowingly reverse

Skip it when you:

- Follow a pattern already documented in an existing ADR
- Make a trivially reversible change with no downstream effects
- Apply a style rule already covered in the instruction files

## Threshold guidance (clarifies "non-trivial")

Write an ADR for decisions that meet one or more of the following:

- Adds or upgrades a third-party dependency that affects runtime or security
- Changes database schema or storage format in a non-backwards-compatible way
- Alters authentication, authorization, or other security posture
- Changes public API contracts, data models, or integrations used by multiple modules
- Introduces a new global pattern (routing, state management, error format) that other work will depend on

Do not write ADRs for:

- Cosmetic refactors, local-only code cleanup, or small performance tweaks
- Single-file changes with no cross-module impact

Examples:

- ADR: Choose between SQL vs. NoSQL for persistent storage — write ADR.
- No ADR: Rename a helper function in one module — skip ADR.

## Workflow

1. Read `decisions/_index.md` — check if an existing decision already covers your situation.
2. If writing a new ADR, create the new ADR file and an index row in the same commit.
3. Use the template below for ADR files.
4. If this supersedes an existing ADR, update that file's `supersededBy` field and mark the new ADR accordingly.

## \_index.md format (required)

Always add/update `decisions/_index.md` when creating or changing ADRs. Each index row must include these columns (example Markdown table recommended):

- **ID:** ADR-NNN (unique identifier)
- **Title:** short descriptive title
- **Status:** proposed | accepted | superseded | deprecated
- **Domain:** backend | frontend | fullstack | infra
- **Date:** YYYY-MM-DD
- **Link:** relative link to the ADR file
- **Notes (optional):** short one-line note (e.g., supersedes ADR-012)

Example index row (one-line Markdown table entry):
| ID | Title | Status | Domain | Date | Link | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| ADR-001 | Choose JSON storage format | accepted | backend | 2026-05-06 | decisions/ADR-001-choose-json-storage.md | — |

> Requirement: The new ADR file and the updated `_index.md` entry must appear together in the same commit/PR.

## Status values

- `proposed` — written, awaiting human review
- `accepted` — in effect; agents must follow this
- `superseded` — replaced by a newer ADR (link it)
- `deprecated` — no longer relevant

Agents must never silently overwrite an accepted decision.
Create a new ADR and mark the old one `superseded` instead.

## Template

---

name: ADR-NNN
title: ""
date: YYYY-MM-DD
status: proposed
domain: backend | frontend | fullstack | infra
agent: <agent-name>
decisionBy: team | <name>
supersedes: —
supersededBy: —

---

### Context

What situation forced this decision? What constraint or open question existed?
(2–4 sentences)

### Decision

What was decided? Lead with one clear sentence.

### Alternatives considered

- **Option A** — why it was on the table, why it lost
- **Option B** — same

### Consequences

- ✅ What gets better
- ⚠️ What becomes a constraint
- ❌ What you're giving up

### Affected files / areas

- list paths or modules

## Example ADR

Example ADR content (fill and adapt):

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

Example `_index.md` entry for the ADR above:

| ADR-000 | Use JSON file storage for import test data | accepted | backend | 2026-05-06 | decisions/ADR-000-example.md | — |
