---
name: ADR-011
status: accepted
date: 2026-11-21
---
# ADR-011: Grid is defined first, then locked; symbols only on a locked grid

Workflow per map: (1) unlocked: fit grid type / cell size / offset to the picture; symbols are not placeable and existing ones are dimmed and frozen; (2) locked: symbols can be placed, moved, edited; grid geometry is frozen. Enforced server-side (`maps.grid_locked`): grid fields -> 409 while locked, token create/update/delete -> 409 while unlocked.

**Unlocking with symbols present:** symbols are stored as cell coordinates (col,row), so they stay in their cells and move *with* the grid while it is adjusted. This keeps relative battle positions intact when the grid is slightly re-fitted. Unlocking asks for confirmation naming the symbol count. Changing the grid *type* (square<->hex) reinterprets the coordinates; the same warning applies and the GM can re-place symbols afterwards. Anyone may lock/unlock (small trusted group). Alternative considered: converting symbols to pixel positions and re-snapping on lock – rejected as surprising and lossy.
