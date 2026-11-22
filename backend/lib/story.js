// Shared story helpers (ADR-013).
export const MAX_DEPTH = 2; // layers: 1 = snippet (place), 2 = scenario. Raise to allow deeper nesting.

export const allParts = (db) => db.prepare('SELECT * FROM story_parts ORDER BY position, id').all();

/** Ids of parts a non-GM may see: unlocked and every ancestor unlocked. */
export function visibleIds(parts) {
  const byId = new Map(parts.map((p) => [p.id, p]));
  const memo = new Map();
  const vis = (p) => {
    if (memo.has(p.id)) return memo.get(p.id);
    const v = !!p.unlocked && (p.parent_id == null || (byId.has(p.parent_id) && vis(byId.get(p.parent_id))));
    memo.set(p.id, v);
    return v;
  };
  return new Set(parts.filter(vis).map((p) => p.id));
}

export const depthOf = (db, id) => {
  let d = 0;
  for (let cur = id; cur != null; d++) cur = db.prepare('SELECT parent_id FROM story_parts WHERE id=?').get(cur)?.parent_id;
  return d;
};
