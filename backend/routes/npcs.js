import { Router } from 'express';
import { notFound, str, patch } from '../lib/util.js';

// NPC pool: GM only (descriptions may contain secrets). Players see NPC names via unlocked story parts.
export default function npcRoutes({ db, hub, auth }) {
  const r = Router();
  const find = (id) => db.prepare('SELECT * FROM npcs WHERE id=?').get(id) ?? (() => { throw notFound('NPC not found'); })();
  r.use('/npcs', auth.requireGm);
  r.get('/npcs', (req, res) => res.json(db.prepare('SELECT * FROM npcs ORDER BY name COLLATE NOCASE, id').all()));
  r.post('/npcs', (req, res) => {
    const b = req.body ?? {};
    const info = db.prepare('INSERT INTO npcs(name,description) VALUES(?,?)')
      .run(str(b.name, 'name', { max: 100 }), str(b.description, 'description', { required: false, max: 5000 }) ?? '');
    hub.emit('npcs');
    res.status(201).json(find(info.lastInsertRowid));
  });
  r.patch('/npcs/:id', (req, res) => {
    const n = find(req.params.id);
    const b = req.body ?? {};
    patch(db, 'npcs', n.id, {
      name: b.name === undefined ? undefined : str(b.name, 'name', { max: 100 }),
      description: b.description === undefined ? undefined : str(b.description, 'description', { required: false, max: 5000 }) ?? '',
    });
    hub.emit('npcs'); hub.emit('story');
    res.json(find(n.id));
  });
  r.delete('/npcs/:id', (req, res) => {
    const n = find(req.params.id);
    db.prepare('DELETE FROM npcs WHERE id=?').run(n.id);
    hub.emit('npcs'); hub.emit('story');
    res.status(204).end();
  });
  return r;
}
