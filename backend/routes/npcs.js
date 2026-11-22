import { Router } from 'express';
import { bad, notFound, str, int, patch, HttpError } from '../lib/util.js';
import { allParts, visibleIds } from '../lib/story.js';

export const MAX_STATS = 8;

// NPC pool (ADR-014). `description` is public info, shown to players once the NPC is linked in a visible story part.
// HP, gm_notes and stats not marked `visible` are GM only.
export default function npcRoutes({ db, hub, auth }) {
  const r = Router();
  const find = (id) => db.prepare('SELECT * FROM npcs WHERE id=?').get(id) ?? (() => { throw notFound('NPC not found'); })();
  const stats = (npcId) => db.prepare('SELECT id, title, value, visible FROM npc_stats WHERE npc_id=? ORDER BY position, id').all(npcId);
  const full = (n) => ({ ...n, stats: stats(n.id) });
  const emit = () => { hub.emit('npcs'); hub.emit('story'); };

  // Players: only NPCs linked in a story part they can see; public fields only.
  r.get('/npcs/:id', (req, res) => {
    const n = find(req.params.id);
    if (auth.isGm(req)) return res.json(full(n));
    const vis = visibleIds(allParts(db));
    const linked = db.prepare('SELECT story_id FROM story_npcs WHERE npc_id=?').all(n.id).some((x) => vis.has(x.story_id));
    if (!linked) throw notFound('NPC not found');
    res.json({ id: n.id, name: n.name, description: n.description, stats: stats(n.id).filter((s) => s.visible).map(({ title, value }) => ({ title, value })) });
  });

  r.use(['/npcs', '/npc-stats'], auth.requireGm);
  r.get('/npcs', (req, res) => res.json(db.prepare('SELECT * FROM npcs ORDER BY name COLLATE NOCASE, id').all().map(full)));
  r.post('/npcs', (req, res) => {
    const b = req.body ?? {};
    const info = db.prepare('INSERT INTO npcs(name,description,gm_notes,hp) VALUES(?,?,?,?)').run(
      str(b.name, 'name', { max: 100 }), str(b.description, 'description', { required: false, max: 5000 }) ?? '',
      str(b.gm_notes, 'gm_notes', { required: false, max: 5000 }) ?? '', b.hp === undefined ? 0 : int(b.hp, 'hp', { min: -9999, max: 99999 }));
    hub.emit('npcs');
    res.status(201).json(full(find(info.lastInsertRowid)));
  });
  r.patch('/npcs/:id', (req, res) => {
    const n = find(req.params.id);
    const b = req.body ?? {};
    patch(db, 'npcs', n.id, {
      name: b.name === undefined ? undefined : str(b.name, 'name', { max: 100 }),
      description: b.description === undefined ? undefined : str(b.description, 'description', { required: false, max: 5000 }) ?? '',
      gm_notes: b.gm_notes === undefined ? undefined : str(b.gm_notes, 'gm_notes', { required: false, max: 5000 }) ?? '',
      hp: b.hp === undefined ? undefined : int(b.hp, 'hp', { min: -9999, max: 99999 }),
    });
    emit();
    res.json(full(find(n.id)));
  });
  r.delete('/npcs/:id', (req, res) => {
    const n = find(req.params.id);
    db.prepare('DELETE FROM npcs WHERE id=?').run(n.id);
    emit();
    res.status(204).end();
  });

  // Custom stat fields: max 8 per NPC, title <= 32 chars
  const statFields = (b) => ({
    title: b.title === undefined ? undefined : str(b.title, 'title', { max: 32 }),
    value: b.value === undefined ? undefined : str(b.value, 'value', { required: false, max: 64 }) ?? '',
    visible: b.visible === undefined ? undefined : (typeof b.visible === 'boolean' ? Number(b.visible) : (() => { throw bad('visible must be a boolean'); })()),
  });
  const findStat = (id) => db.prepare('SELECT * FROM npc_stats WHERE id=?').get(id) ?? (() => { throw notFound('Stat not found'); })();
  r.post('/npcs/:id/stats', (req, res) => {
    const n = find(req.params.id);
    if (db.prepare('SELECT COUNT(*) AS c FROM npc_stats WHERE npc_id=?').get(n.id).c >= MAX_STATS) throw new HttpError(409, `An NPC can have at most ${MAX_STATS} stat fields`);
    const f = statFields(req.body ?? {});
    if (f.title === undefined) throw bad('title is required');
    const pos = db.prepare('SELECT COALESCE(MAX(position),0)+1 AS n FROM npc_stats WHERE npc_id=?').get(n.id).n;
    const info = db.prepare('INSERT INTO npc_stats(npc_id,position,title,value,visible) VALUES(?,?,?,?,?)').run(n.id, pos, f.title, f.value ?? '', f.visible ?? 0);
    emit();
    res.status(201).json(findStat(info.lastInsertRowid));
  });
  r.patch('/npc-stats/:id', (req, res) => {
    const s = findStat(req.params.id);
    patch(db, 'npc_stats', s.id, statFields(req.body ?? {}));
    emit();
    res.json(findStat(s.id));
  });
  r.delete('/npc-stats/:id', (req, res) => {
    const s = findStat(req.params.id);
    db.prepare('DELETE FROM npc_stats WHERE id=?').run(s.id);
    emit();
    res.status(204).end();
  });
  return r;
}
