import { Router } from 'express';
import { bad, notFound, str, patch } from '../lib/util.js';

// Locked parts do not exist for non-GM users: not listed, not readable (not even the title). ADR-007/012.
export default function storyRoutes({ db, hub, auth }) {
  const r = Router();
  const get = (id) => db.prepare('SELECT * FROM story_parts WHERE id=?').get(id) ?? (() => { throw notFound('Story part not found'); })();

  r.get('/story', (req, res) => {
    const gm = auth.isGm(req);
    const rows = db.prepare('SELECT * FROM story_parts ORDER BY position, id').all();
    res.json(gm ? rows : rows.filter((p) => p.unlocked));
  });
  r.get('/story/:id', (req, res) => {
    const p = get(req.params.id);
    if (!p.unlocked && !auth.isGm(req)) throw notFound('Story part not found');
    res.json(p);
  });

  r.use('/story', (req, res, next) => (req.method === 'GET' ? next() : auth.requireGm(req, res, next)));

  r.post('/story', (req, res) => {
    const b = req.body ?? {};
    const pos = db.prepare('SELECT COALESCE(MAX(position),0)+1 AS n FROM story_parts').get().n;
    const info = db.prepare('INSERT INTO story_parts(position,title,body) VALUES(?,?,?)')
      .run(pos, str(b.title, 'title', { max: 200 }), str(b.body, 'body', { required: false, max: 100000 }) ?? '');
    hub.emit('story');
    res.status(201).json(get(info.lastInsertRowid));
  });
  // must be before /story/:id routes
  r.post('/story/reorder', (req, res) => {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || !ids.every(Number.isInteger)) throw bad('ids must be an array of integers');
    const all = db.prepare('SELECT id FROM story_parts').all().map((x) => x.id);
    if (ids.length !== all.length || !all.every((i) => ids.includes(i))) throw bad('ids must contain every story part exactly once');
    const up = db.prepare('UPDATE story_parts SET position=? WHERE id=?');
    ids.forEach((id, i) => up.run(i + 1, id));
    hub.emit('story');
    res.json(db.prepare('SELECT * FROM story_parts ORDER BY position').all());
  });
  r.patch('/story/:id', (req, res) => {
    const p = get(req.params.id);
    const b = req.body ?? {};
    patch(db, 'story_parts', p.id, {
      title: b.title === undefined ? undefined : str(b.title, 'title', { max: 200 }),
      body: b.body === undefined ? undefined : str(b.body, 'body', { required: false, max: 100000 }) ?? '',
    });
    hub.emit('story', p.id);
    res.json(get(p.id));
  });
  r.post('/story/:id/unlock', (req, res) => {
    const p = get(req.params.id);
    db.prepare("UPDATE story_parts SET unlocked=1, unlocked_at=COALESCE(unlocked_at, datetime('now')) WHERE id=?").run(p.id);
    hub.emit('story', p.id);
    res.json(get(p.id));
  });
  r.post('/story/:id/lock', (req, res) => {
    const p = get(req.params.id);
    db.prepare('UPDATE story_parts SET unlocked=0 WHERE id=?').run(p.id);
    hub.emit('story', p.id);
    res.json(get(p.id));
  });
  r.delete('/story/:id', (req, res) => {
    const p = get(req.params.id);
    db.prepare('DELETE FROM story_parts WHERE id=?').run(p.id);
    hub.emit('story', p.id);
    res.status(204).end();
  });
  return r;
}
