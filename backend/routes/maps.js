import { Router } from 'express';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { withLinks, parseLinks, saveItems, hasLinkInput } from '../lib/tokenLinks.js';
import { HttpError, bad, notFound, str, int, num, patch, sniff } from '../lib/util.js';

const GRIDS = ['square', 'hex', 'none'];

export default function mapsRoutes({ db, hub, auth, filesDir }) {
  const r = Router();
  const getMap = (id) => db.prepare('SELECT * FROM maps WHERE id=?').get(id) ?? (() => { throw notFound('Map not found'); })();
  // Locked maps do not exist for non-GM users (ADR-013).
  const getMapFor = (req, id) => {
    const m = getMap(id);
    if (!m.unlocked && !auth.isGm(req)) throw notFound('Map not found');
    return m;
  };
  const getToken = (id) => {
    const t = db.prepare('SELECT * FROM tokens WHERE id=?').get(id);
    if (!t) throw notFound('Token not found');
    return withLinks(db, [t])[0];
  };
  // Links to NPCs / blueprints are GM only (ADR-014); returns the validated link fields.
  const linksFrom = (req) => {
    const b = req.body ?? {};
    if (!hasLinkInput(b)) return {};
    if (!auth.isGm(req)) throw new HttpError(403, 'GM access required to link data to a symbol');
    return parseLinks(db, b);
  };

  r.get('/maps', (req, res) => {
    const rows = db.prepare('SELECT * FROM maps ORDER BY id DESC').all();
    res.json(auth.isGm(req) ? rows : rows.filter((m) => m.unlocked));
  });
  r.get('/maps/:id', (req, res) => {
    const m = getMapFor(req, req.params.id);
    res.json({ ...m, tokens: withLinks(db, db.prepare('SELECT * FROM tokens WHERE map_id=? ORDER BY id').all(m.id)) });
  });

  // Upload: raw image body; ?title=&w=&h= (pixel size read by the browser)
  r.post('/maps', express.raw({ type: () => true, limit: '25mb' }), (req, res) => {
    const type = sniff(req.body);
    if (!type || type.mime === 'application/pdf') throw bad('Map must be png, jpg or webp');
    const q = (k) => { const v = Number(req.query[k]); return Number.isInteger(v) ? v : NaN; };
    const w = int(q('w'), 'w', { min: 1, max: 20000 });
    const h = int(q('h'), 'h', { min: 1, max: 20000 });
    const file = `${crypto.randomUUID()}.${type.ext}`;
    fs.writeFileSync(path.join(filesDir, file), req.body);
    const info = db.prepare('INSERT INTO maps(title,image_file,img_w,img_h,unlocked) VALUES(?,?,?,?,?)')
      .run(str(req.query.title, 'title', { max: 200 }), file, w, h, auth.isGm(req) ? 0 : 1); // GM maps start hidden, player maps are shared at once
    hub.emit('maps');
    res.status(201).json(getMap(info.lastInsertRowid));
  });
  r.post('/maps/:id/unlock', auth.requireGm, (req, res) => setUnlocked(req, res, 1));
  r.post('/maps/:id/lock', auth.requireGm, (req, res) => setUnlocked(req, res, 0));
  function setUnlocked(req, res, v) {
    const m = getMap(req.params.id);
    db.prepare('UPDATE maps SET unlocked=? WHERE id=?').run(v, m.id);
    hub.emit('maps', m.id);
    hub.emit('story');
    res.json(getMap(m.id));
  }
  r.patch('/maps/:id', (req, res) => {
    const m = getMapFor(req, req.params.id);
    const b = req.body ?? {};
    if (b.grid_locked !== undefined && typeof b.grid_locked !== 'boolean') throw bad('grid_locked must be a boolean');
    // Locked grid: geometry is frozen; unlock first (may be in the same request).
    const touchesGrid = ['grid_type', 'cell_px', 'offset_x', 'offset_y'].some((k) => b[k] !== undefined);
    if (m.grid_locked && touchesGrid && b.grid_locked !== false) throw new HttpError(409, 'Grid is locked – unlock it first');
    if (b.grid_type !== undefined && !GRIDS.includes(b.grid_type)) throw bad(`grid_type must be one of ${GRIDS.join(', ')}`);
    patch(db, 'maps', m.id, {
      title: b.title === undefined ? undefined : str(b.title, 'title', { max: 200 }),
      grid_type: b.grid_type,
      grid_locked: b.grid_locked === undefined ? undefined : Number(b.grid_locked),
      cell_px: b.cell_px === undefined ? undefined : num(b.cell_px, 'cell_px', { min: 4, max: 5000 }),
      offset_x: b.offset_x === undefined ? undefined : num(b.offset_x, 'offset_x'),
      offset_y: b.offset_y === undefined ? undefined : num(b.offset_y, 'offset_y'),
      session_id: b.session_id === undefined ? undefined : (b.session_id === null ? null : int(b.session_id, 'session_id', { min: 1 })),
    });
    hub.emit('maps', m.id);
    res.json(getMap(m.id));
  });
  r.delete('/maps/:id', auth.requireGm, (req, res) => {
    const m = getMap(req.params.id);
    db.prepare('DELETE FROM maps WHERE id=?').run(m.id);
    fs.rmSync(path.join(filesDir, m.image_file), { force: true });
    hub.emit('maps', m.id);
    hub.emit('story');
    res.status(204).end();
  });

  const fields = (b, partial) => {
    const o = {
      symbol: b.symbol === undefined ? undefined : str(b.symbol, 'symbol', { max: 8 }),
      label: b.label === undefined ? undefined : str(b.label, 'label', { max: 60, required: false }) ?? '',
      color: b.color === undefined ? undefined : (/^#[0-9a-fA-F]{6}$/.test(b.color) ? b.color : (() => { throw bad('color must be #rrggbb'); })()),
      col: b.col === undefined ? undefined : int(b.col, 'col', { min: -1000, max: 1000 }),
      row: b.row === undefined ? undefined : int(b.row, 'row', { min: -1000, max: 1000 }),
      elevation: b.elevation === undefined ? undefined : int(b.elevation, 'elevation', { min: -999, max: 999 }),
      size: b.size === undefined ? undefined : int(b.size, 'size', { min: 1, max: 5 }),
      note: b.note === undefined ? undefined : str(b.note, 'note', { max: 500, required: false }) ?? '',
    };
    return o;
  };

  const needLocked = (m) => { if (!m.grid_locked) throw new HttpError(409, 'Lock the grid before placing symbols'); };

  r.post('/maps/:id/tokens', (req, res) => {
    const m = getMapFor(req, req.params.id);
    needLocked(m);
    const { item_ids: itemIds, ...links } = linksFrom(req);
    const f = Object.fromEntries(Object.entries({ ...fields(req.body ?? {}), ...links }).filter(([, v]) => v !== undefined));
    const cols = ['map_id', ...Object.keys(f)];
    const info = db.prepare(`INSERT INTO tokens(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`).run(m.id, ...Object.values(f));
    if (itemIds) saveItems(db, info.lastInsertRowid, itemIds);
    hub.emit('tokens', m.id);
    res.status(201).json(getToken(info.lastInsertRowid));
  });
  r.patch('/tokens/:id', (req, res) => {
    const t = getToken(req.params.id);
    needLocked(getMapFor(req, t.map_id));
    const { item_ids: itemIds, ...links } = linksFrom(req);
    const f = { ...fields(req.body ?? {}), ...links };
    if (Object.values(f).some((v) => v !== undefined) || !itemIds) patch(db, 'tokens', t.id, f);
    if (itemIds) saveItems(db, t.id, itemIds);
    hub.emit('tokens', t.map_id);
    res.json(getToken(t.id));
  });
  r.delete('/tokens/:id', (req, res) => {
    const t = getToken(req.params.id);
    needLocked(getMapFor(req, t.map_id));
    db.prepare('DELETE FROM tokens WHERE id=?').run(t.id);
    hub.emit('tokens', t.map_id);
    res.status(204).end();
  });
  return r;
}
