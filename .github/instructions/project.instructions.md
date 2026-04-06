---
name: project.instructions
description: "Use when: repository-wide decisions, contribution rules, code style, and PR guidance."
applyTo: "**"
visibility: public
---

**Maintainer:** Team
**Purpose:** Repository-wide conventions, contribution flow, and high-level policies for the AI assistant.

Key guidelines
- Follow existing project coding styles; prefer small, reviewable diffs.
- When proposing changes, include tests and update relevant docs.
- Reference `copilot-instructions.md` for workspace-level policies.

PRs and reviews
- Provide a clear summary and brief test steps in PR descriptions.
- For changes touching security or data handling, request an additional reviewer.

Frontmatter template (required fields)
- `name`: unique identifier
- `description`: short discovery text with trigger phrases
- `applyTo`: glob(s) for files this instruction applies to
- `visibility`: public | private
