# ADR-013 Story tree, NPC pool, note links, map locks (issue #2)

Status: accepted

- **Story tree**: `story_parts` gets `parent_id` (self reference, cascade), `location`, `map_id`. Fields: title, location, NPCs, description (`body`), map. Layer 1 = snippet (a place), layer 2 = scenario. The schema is unlimited; the backend constant `MAX_DEPTH` (=2) limits it, raising it later needs no migration.
- **Visibility**: a part is visible to players only if it *and all ancestors* are unlocked (locking a snippet hides its scenarios). Hidden parts stay fully hidden (ADR-012).
- **NPC pool**: new `npcs` table + `story_npcs` link table. The pool is GM-only; players only see names of NPCs linked in visible parts (descriptions may hold secrets).
- **Note links**: `notes.story_id` (set null on delete). The title is only returned when the requester may see the part; players can only link visible parts.
- **Maps**: `maps.unlocked` (default 0 = hidden, new maps start locked; existing maps were migrated to unlocked). Any member can create a map (GM-created maps start locked, player-created ones are visible at once); only the GM locks/unlocks maps. Locked maps, their tokens and image file are hidden from players. Linking a map in a story does not unlock it; the GM unlocks it separately (story or map view).
- **Reorder** is per sibling group (`parent_id`).
