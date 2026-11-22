import { bad, int } from './util.js';

// Marker links (ADR-014): up to 5 item blueprints, 1 creature blueprint and 1 NPC per token. Only the GM may set them.
export const MAX_ITEMS = 5;
export const LINK_KEYS = ['npc_id', 'creature_id', 'item_ids'];
export const hasLinkInput = (b) => LINK_KEYS.some((k) => b[k] !== undefined);

const exists = (db, sql, id) => !!db.prepare(sql).get(id);

/** Validated link fields from a request body; only the keys that were sent. */
export function parseLinks(db, b) {
  const o = {};
  if (b.npc_id !== undefined) {
    o.npc_id = b.npc_id === null ? null : int(b.npc_id, 'npc_id', { min: 1 });
    if (o.npc_id !== null && !exists(db, 'SELECT 1 FROM npcs WHERE id=?', o.npc_id)) throw bad('NPC not found');
  }
  if (b.creature_id !== undefined) {
    o.creature_id = b.creature_id === null ? null : int(b.creature_id, 'creature_id', { min: 1 });
    if (o.creature_id !== null && !exists(db, "SELECT 1 FROM blueprints WHERE kind='creature' AND id=?", o.creature_id)) throw bad('Creature blueprint not found');
  }
  if (b.item_ids !== undefined) {
    if (!Array.isArray(b.item_ids)) throw bad('item_ids must be an array');
    if (b.item_ids.length > MAX_ITEMS) throw bad(`A marker can link at most ${MAX_ITEMS} items`);
    const ids = b.item_ids.map((x) => int(x, 'item_ids', { min: 1 }));
    if (new Set(ids).size !== ids.length) throw bad('item_ids must be unique');
    for (const id of ids) if (!exists(db, "SELECT 1 FROM blueprints WHERE kind='item' AND id=?", id)) throw bad('Item blueprint not found');
    o.item_ids = ids;
  }
  return o;
}

export function saveItems(db, tokenId, ids) {
  db.prepare('DELETE FROM token_items WHERE token_id=?').run(tokenId);
  const ins = db.prepare('INSERT INTO token_items(token_id,blueprint_id,position) VALUES(?,?,?)');
  ids.forEach((id, i) => ins.run(tokenId, id, i));
}

/** Adds { npc, creature, items } ({id,name} only; details are fetched on demand) to token rows. */
export function withLinks(db, tokens) {
  if (!tokens.length) return [];
  const qs = tokens.map(() => '?').join(',');
  const ids = tokens.map((t) => t.id);
  const npcs = new Map(db.prepare('SELECT id,name FROM npcs').all().map((n) => [n.id, n]));
  const bps = new Map(db.prepare('SELECT id,name FROM blueprints').all().map((n) => [n.id, n]));
  const items = new Map();
  for (const r of db.prepare(`SELECT ti.token_id, b.id, b.name FROM token_items ti JOIN blueprints b ON b.id=ti.blueprint_id WHERE ti.token_id IN (${qs}) ORDER BY ti.position`).all(...ids)) {
    if (!items.has(r.token_id)) items.set(r.token_id, []);
    items.get(r.token_id).push({ id: r.id, name: r.name });
  }
  return tokens.map((t) => ({ ...t, npc: npcs.get(t.npc_id) ?? null, creature: bps.get(t.creature_id) ?? null, items: items.get(t.id) ?? [] }));
}
