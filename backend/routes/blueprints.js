import { Router } from 'express';
import { notFound, patch } from '../lib/util.js';
import { cleanBlueprint, kindOf, parseRow } from '../lib/blueprints.js';

// Item / creature blueprints (ADR-014). The library is GM only; a player may read one blueprint only while it is
// linked to a marker on a map they can see (the GM's link is the reveal).
export default function blueprintRoutes({ db, hub, auth }) {
  const r = Router();
  const find = (id) => db.prepare('SELECT * FROM blueprints WHERE id=?').get(id) ?? (() => { throw notFound('Blueprint not found'); })();
  const shown = (id) => !!db.prepare(`SELECT 1 FROM tokens t JOIN maps m ON m.id=t.map_id WHERE m.unlocked=1 AND
    (t.creature_id=? OR EXISTS(SELECT 1 FROM token_items ti WHERE ti.token_id=t.id AND ti.blueprint_id=?))`).get(id, id);
  const changed = () => { hub.emit('blueprints'); hub.emit('tokens'); };

  r.get('/blueprints/:id', (req, res) => {
    const b = find(req.params.id);
    if (!auth.isGm(req) && !shown(b.id)) throw notFound('Blueprint not found');
    res.json(parseRow(b));
  });

  r.use('/blueprints', auth.requireGm);
  r.get('/blueprints', (req, res) => {
    const kind = req.query.kind === undefined ? null : kindOf(req.query.kind);
    res.json(db.prepare(`SELECT id, kind, name, subtitle, source FROM blueprints ${kind ? 'WHERE kind=?' : ''} ORDER BY name COLLATE NOCASE, id`).all(...(kind ? [kind] : [])));
  });
  r.post('/blueprints', (req, res) => {
    const c = cleanBlueprint(req.body);
    const info = db.prepare('INSERT INTO blueprints(kind,name,subtitle,body,stats) VALUES(?,?,?,?,?)')
      .run(kindOf(req.body?.kind), c.name, c.subtitle, c.body, JSON.stringify(c.stats));
    hub.emit('blueprints');
    res.status(201).json(parseRow(find(info.lastInsertRowid)));
  });
  r.patch('/blueprints/:id', (req, res) => {
    const b = find(req.params.id);
    const cur = parseRow(b);
    const c = cleanBlueprint({ ...cur, ...req.body }); // kind cannot change
    patch(db, 'blueprints', b.id, { name: c.name, subtitle: c.subtitle, body: c.body, stats: JSON.stringify(c.stats) });
    changed();
    res.json(parseRow(find(b.id)));
  });
  r.delete('/blueprints/:id', (req, res) => {
    const b = find(req.params.id);
    db.prepare('DELETE FROM blueprints WHERE id=?').run(b.id);
    changed();
    res.status(204).end();
  });
  return r;
}
