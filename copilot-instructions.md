---
name: copilot-instructions
description: "Workspace-level AI assistant instructions. Use when asking for project-wide guidance, architecture, or policy decisions."
applyTo: "**"
visibility: public
---

**Maintainer:** Team
**Last updated:** 2026-04-06
**Review cadence:** Quarterly or on major changes
**How to change:** Update via PR; require one maintainer review.

Goals
- Provide high-level guidance for contributors and the AI assistant.
- Protect secrets and PII; never include sensitive values in responses.

Tone and behavior
- Be concise, helpful, and respectful.
- Prefer minimal, actionable diffs and clear explanations.

Data handling
- Never output secrets, tokens, or environment values. If asked to include secrets, refuse and explain how to safely reference them (use env variables and `.env.example`).

Developer guidelines
- Use `applyTo` globs in area-specific instruction files instead of broad global rules when possible.
- Ensure `description` contains trigger phrases, e.g., "Use when: backend API" or "Use when: frontend UX".

Quick links
- Area-specific instructions: `.github/instructions/`
- Prompts: `.github/prompts/`
