---
name: summarize-api
description: "Prompt template: Summarize API endpoints for a backend folder or file."
---

Context:
- Project: TTRPG helper backend
- Input: path to code or endpoint list

Template:
"Given the following backend code or list of routes, produce a concise API summary table listing: HTTP method, path, purpose, request body shape, response shape, authentication required. Keep entries short (1-2 lines each). If any endpoint is undocumented, mark it as 'needs docs'."
