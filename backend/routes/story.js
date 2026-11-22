import { Router } from 'express';
import { bad, notFound, str, int, patch } from '../lib/util.js';
import { MAX_DEPTH, allParts, visibleIds, depthOf } from '../lib/story.js';

// Locked parts (or parts below a locked part) do not exist for non-GM users: not listed, not readable. ADR-007/012/013.
export default function storyRoutes({ db, hub, auth }) {
  const r = Router();
  const find = (id) => db.prepare('SELECT * FROM story_parts WHERE id=?').get(id) ?? (() => { throw notFound('Story part not found'); })();

  // Adds npcs + map to rows. Players get NPC names only and the map only once the GM unlocked it separately.
  function shape(rows, gm) {
    const npcs = db.prepare('SELECT sn.story_id, n.id, n.name FROM story_npcs sn JOIN npcs n ON n.id=sn.npc_id ORDER BY n.name').all();
    const maps = new Map(db.prepare('SELECT id, title, unlocked FROM maps').all().map((m) => [m.id, m]));
    return rows.map((p) => {
      const m = p.map_id ? maps.get(p.map_id) : null;
      const out = { ...p, npcs: npcs.filter((n) => n.story_id === p.id).map(({ id, name }) => ({ id, name })) };
      if (gm) return { ...out, map: m ? { id: m.id, title: m.title, unlocked: !!m.unlocked } : null };
      return { ...out, map_id: m?.unlocked ? m.id : null, map: m?.unlocked ? { id: m.id, title: m.title, unlocked: true } : null };
    });
  }
  const one = (id, gm) => shape([find(id)], gm)[0];

  r.get('/story', (req, res) => {
    const gm = auth.isGm(req);
    const rows = allParts(db);
    const vis = gm ? null : visibleIds(rows);
    res.json(shape(gm ? rows : rows.filter((p) => vis.has(p.id)), gm));
  });
  r.get('/story/:id', (req, res) => {
    const p = find(req.params.id);
    const gm = auth.isGm(req);
    if (!gm && !visibleIds(allParts(db)).has(p.id)) throw notFound('Story part not found');
    res.json(shape([p], gm)[0]);
  });

  r.use('/story', (req, res, next) => (req.method === 'GET' ? next() : auth.requireGm(req, res, next)));

  const mapId = (v) => {
    if (v === null) return null;
    const id = int(v, 'map_id', { min: 1 });
    if (!db.prepare('SELECT 1 FROM maps WHERE id=?').get(id)) throw bad('Unknown map');
    return id;
  };
  const setNpcs = (storyId, ids) => {
    if (!Array.isArray(ids) || !ids.every((i) => Number.isInteger(i))) throw bad('npc_ids must be an array of integers');
    const uniq = [...new Set(ids)];
    if (!uniq.every((i) => db.prepare('SELECT 1 FROM npcs WHERE id=?').get(i))) throw bad('Unknown NPC');
    db.prepare('DELETE FROM story_npcs WHERE story_id=?').run(storyId);
    uniq.forEach((i) => db.prepare('INSERT INTO story_npcs(story_id,npc_id) VALUES(?,?)').run(storyId, i));
  };
  const fields = (b) => ({
    title: b.title === undefined ? undefined : str(b.title, 'title', { max: 200 }),
    location: b.location === undefined ? undefined : str(b.location, 'location', { required: false, max: 200 }) ?? '',
    body: b.body === undefined ? undefined : str(b.body, 'body', { required: false, max: 100000 }) ?? '',
    map_id: b.map_id === undefined ? undefined : mapId(b.map_id),
  });

  r.post('/story', (req, res) => {
    const b = req.body ?? {};
    let parent = null;
    if (b.parent_id !== undefined && b.parent_id !== null) {
      parent = find(int(b.parent_id, 'parent_id', { min: 1 })).id;
      if (depthOf(db, parent) + 1 > MAX_DEPTH) throw bad(`Story is limited to ${MAX_DEPTH} layers`);
    }
    const f = fields({ ...b, title: b.title ?? undefined });
    if (f.title === undefined) throw bad('title is required');
    const pos = db.prepare('SELECT COALESCE(MAX(position),0)+1 AS n FROM story_parts WHERE parent_id IS ?').get(parent).n;
    const info = db.prepare('INSERT INTO story_parts(position,parent_id,title,location,body,map_id) VALUES(?,?,?,?,?,?)')
      .run(pos, parent, f.title, f.location ?? '', f.body ?? '', f.map_id ?? null);
    if (b.npc_ids !== undefined) setNpcs(info.lastInsertRowid, b.npc_ids);
    hub.emit('story');
    res.status(201).json(one(info.lastInsertRowid, true));
  });
  // must be before /story/:id routes. Reorders the siblings under parent_id (null = top layer).
  r.post('/story/reorder', (req, res) => {
    const { ids, parent_id: parent = null } = req.body ?? {};
    if (!Array.isArray(ids) || !ids.every(Number.isInteger)) throw bad('ids must be an array of integers');
    if (parent !== null) int(parent, 'parent_id', { min: 1 });
    const all = db.prepare('SELECT id FROM story_parts WHERE parent_id IS ?').all(parent).map((x) => x.id);
    if (ids.length !== all.length || new Set(ids).size !== ids.length || !all.every((i) => ids.includes(i))) throw bad('ids must contain every sibling story part exactly once');
    const up = db.prepare('UPDATE story_parts SET position=? WHERE id=?');
    ids.forEach((id, i) => up.run(i + 1, id));
    hub.emit('story');
    res.json(shape(allParts(db), true));
  });
  r.patch('/story/:id', (req, res) => {
    const p = find(req.params.id);
    const b = req.body ?? {};
    const f = fields(b);
    if (Object.values(f).some((v) => v !== undefined)) patch(db, 'story_parts', p.id, f);
    else if (b.npc_ids === undefined) throw bad('No fields to update');
    if (b.npc_ids !== undefined) setNpcs(p.id, b.npc_ids);
    hub.emit('story', p.id);
    res.json(one(p.id, true));
  });
  r.post('/story/:id/unlock', (req, res) => {
    const p = find(req.params.id);
    db.prepare("UPDATE story_parts SET unlocked=1, unlocked_at=COALESCE(unlocked_at, datetime('now')) WHERE id=?").run(p.id);
    hub.emit('story', p.id);
    res.json(one(p.id, true));
  });
  r.post('/story/:id/lock', (req, res) => {
    const p = find(req.params.id);
    db.prepare('UPDATE story_parts SET unlocked=0 WHERE id=?').run(p.id);
    hub.emit('story', p.id);
    res.json(one(p.id, true));
  });
  r.delete('/story/:id', (req, res) => {
    const p = find(req.params.id);
    db.prepare('DELETE FROM story_parts WHERE id=?').run(p.id);
    hub.emit('story', p.id);
    hub.emit('notes');
    res.status(204).end();
  });
  return r;
}
