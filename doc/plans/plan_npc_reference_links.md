## Plan: NPC Reference Links in Quill Content

Add a custom NPC-link insertion flow to both Quill editors (chapter story + encounter description), store links as normal anchor tags with an NPC-id-encoded href, and handle click events in rendered HTML to open the matching NPC card in the sidebar. For missing NPC targets, open a replacement popover at click location with an inline error message, then rewrite only the clicked link and persist immediately via existing save callbacks.

**Steps**

1. Discovery confirmation and constraints
2. Verify existing data flow in the adventure content shell and keep changes frontend-only (_done in planning_): chapter/encounter content components own rendered HTML; NPC list state is in sidebar components; all saves flow through existing callbacks in the view.
3. Reuse no-new-library approach: use PrimeVue `Popover` + existing Quill/Editor APIs; do not add dependencies.
4. Define reference format and parsing
5. Link format: store NPC references as normal links with href pattern `#npc:{npcId}` and visible label as NPC name (standard link highlighting from browser/Quill).
6. Add shared helpers in `frontend/src/utils/richText.js` for: `buildNpcHref(npcId)`, `parseNpcHref(href)`, `isNpcLinkAnchor(anchorEl)`, and `replaceSingleNpcLinkInHtml(html, targetDescriptor, replacementNpc)` where target descriptor identifies one clicked anchor instance.
7. Wire NPC open behavior across layout
8. In `frontend/src/views/AdventureContent.vue`, add provided/injected coordination APIs/state:
9. Provide a function to request opening an NPC by id from content components.
10. Provide reactive signal object for focused NPC (token + npcId) consumed by NPC sidebar.
11. In `frontend/src/components/NPCOverview.vue`, receive focus signal, find matching NPC item, ensure target card expands (without collapsing others), and scroll target card into view.
12. In `frontend/src/components/NPCSummary.vue`, add watcher for focused signal and set `isPanelCollapsed = false` when signal npc id matches current card.
13. Add custom Quill toolbar button + picker popover in both editors
14. In `frontend/src/components/ChapterContent.vue`, extend editor toolbar with a custom NPC-link button.
15. Inject available NPC list (existing provided `adventureNPCs`) and render a PrimeVue popover picker attached to the toolbar button.
16. On selection, insert/update link at current Quill selection using NPC name label and `#npc:{id}` href.
17. Mirror the same behavior in `frontend/src/components/EncounterContent.vue` so encounter description editor has identical UX.
18. Extract shared UI/logic into a small reusable component/composable (recommended `frontend/src/components/RichTextNpcLinkPicker.vue` or `frontend/src/composables/useNpcLinkEditor.js`) to avoid duplicated Quill button/popup logic between chapter and encounter editors.
19. Handle rendered HTML clicks (outside editor)
20. In non-edit mode containers for story/description (`.story-text`, `.encounter-description`), attach delegated click handlers for anchors.
21. If clicked anchor is valid NPC link and NPC exists: prevent default and call provided open-NPC function.
22. If clicked anchor is NPC link but target missing: open replacement popover near click with top inline message (e.g. “Referenced NPC no longer exists. Please choose a replacement.”), list current adventure NPCs, and on choose update only the clicked anchor in that field.
23. Persist replacements immediately using existing save callbacks:
24. Chapter story: call `onSaveChapter` with updated `story` and unchanged other fields.
25. Encounter description: call `onSaveEncounter` with updated `description` and existing `id/type`.
26. Keep failures surfaced via existing local error text handling.
27. Security and robustness
28. Restrict click handling strictly to npc-link href pattern (`#npc:`); never execute or follow other link targets from delegated handler.
29. Keep `v-html` rendering but ensure the NPC-link handler only reads DOM attributes and uses internal id matching; do not evaluate arbitrary HTML/script.
30. Fallback when no NPCs are available: disable toolbar NPC-link button and show empty-state text in popover.
31. Optional: mark broken NPC links visually in rendered mode (CSS class via runtime DOM check) if desired later; exclude from this implementation scope unless requested.
32. Validation and regression checks
33. Manual functional pass for both chapter story and encounter description editors:
34. Insert NPC link from toolbar popover.
35. Save and exit editor, click rendered link, verify matching NPC card opens and scrolls into view while other cards remain unchanged.
36. Delete referenced NPC, click rendered broken link, verify replacement popover + inline error appears, choose NPC, verify only clicked link updates and persists.
37. Confirm normal external links (if any) are unaffected by NPC-link click handler.
38. Run frontend lint/tests per project scripts and verify no Vue warnings.

**Relevant files**

- `c:/Users/Tim/projects/LLMgSE/semesterprojekt-ss-2026-ttrpg_helper/frontend/src/components/ChapterContent.vue` — add custom toolbar button, NPC picker popovers, rendered click handling, and chapter save integration for relinking.
- `c:/Users/Tim/projects/LLMgSE/semesterprojekt-ss-2026-ttrpg_helper/frontend/src/components/EncounterContent.vue` — same as chapter for encounter description plus encounter save integration.
- `c:/Users/Tim/projects/LLMgSE/semesterprojekt-ss-2026-ttrpg_helper/frontend/src/components/NPCOverview.vue` — consume focus signal and scroll/open target NPC card.
- `c:/Users/Tim/projects/LLMgSE/semesterprojekt-ss-2026-ttrpg_helper/frontend/src/components/NPCSummary.vue` — expand targeted card on focus signal.
- `c:/Users/Tim/projects/LLMgSE/semesterprojekt-ss-2026-ttrpg_helper/frontend/src/views/AdventureContent.vue` — provide open-NPC coordination function/signal for chapter and encounter content.
- `c:/Users/Tim/projects/LLMgSE/semesterprojekt-ss-2026-ttrpg_helper/frontend/src/utils/richText.js` — add NPC link parsing/building/replacement utilities.
- `c:/Users/Tim/projects/LLMgSE/semesterprojekt-ss-2026-ttrpg_helper/frontend/src/components/RichTextNpcLinkPicker.vue` (new, recommended) — shared popover list + selection UI for Quill toolbar and broken-link replacement.

**Verification**

1. Run `npm run lint` in `frontend/` and fix issues.
2. Start app with `npm run dev` in `frontend/`.
3. In one chapter story and one encounter description, add NPC links via toolbar; save and verify rendered links are clickable.
4. Click each rendered NPC link and confirm NPC panel expands + scrolls to correct card.
5. Delete a referenced NPC, click broken link, confirm replacement popover appears with inline error text at top.
6. Pick replacement NPC and verify only that clicked link changes (text + href) and remains after reload.
7. Verify keyboard usability: toolbar button focusable, popover list items selectable by keyboard, and close behavior sane.

**Decisions**

- Use PrimeVue `Popover` for NPC selection in both insertion and broken-link replacement flows.
- Use NPC name as link text and standard link styling.
- Open targeted NPC card while leaving other cards unchanged.
- For missing references, update only the clicked link instance.
- Scope includes frontend behavior only; no backend/API/schema changes.

**Further Considerations**

1. Anchor encoding choice recommendation: keep `#npc:{id}` for simple parsing and zero navigation side effects; alternative is path/query encoding.
2. If users need custom link labels later, extend picker with optional label override input without changing href/id semantics.
3. If duplicate NPC names become common, show both name and id in popover list rows while still inserting name-only link text by default.
