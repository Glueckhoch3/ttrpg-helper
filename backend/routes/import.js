import { Router } from 'express';
import express from 'express';
import { bad } from '../lib/util.js';
import { formats, parseImport, MAX_IMPORT } from '../lib/importers/index.js';

// GM-only import of uploaded JSON files into the blueprint library (ADR-014). Two steps, both stateless:
// preview lists what the file contains, commit re-parses and stores the chosen entries.
export default function importRoutes({ db, hub, auth }) {
  const r = Router();
  r.use('/import', auth.requireGm);
  const json = express.json({ limit: '15mb' }); // app.js skips its 1 MB parser for /api/import
  const has = db.prepare('SELECT 1 FROM blueprints WHERE kind=? AND name=? COLLATE NOCASE');

  r.get('/import/formats', (req, res) => res.json(formats()));

  r.post('/import/preview', json, (req, res) => {
    const { kind, entries, skipped } = parseImport(req.body?.format, req.body?.kind, req.body?.data);
    res.json({
      skipped,
      entries: entries.map((e, index) => ({ index, name: e.name, subtitle: e.subtitle, duplicate: !!has.get(kind, e.name) })),
    });
  });

  r.post('/import', json, (req, res) => {
    const { imp, kind, entries } = parseImport(req.body?.format, req.body?.kind, req.body?.data);
    let chosen = entries;
    if (req.body.indexes !== undefined) {
      if (!Array.isArray(req.body.indexes) || !req.body.indexes.every((i) => Number.isInteger(i))) throw bad('indexes must be an array of integers');
      chosen = [...new Set(req.body.indexes)].filter((i) => i >= 0 && i < entries.length).map((i) => entries[i]);
    }
    if (chosen.length > MAX_IMPORT) throw bad(`Import at most ${MAX_IMPORT} entries at once`);
    const ins = db.prepare('INSERT INTO blueprints(kind,name,subtitle,body,stats,source) VALUES(?,?,?,?,?,?)');
    let imported = 0;
    db.exec('BEGIN');
    try {
      for (const e of chosen) {
        if (has.get(kind, e.name)) continue; // same kind + name: keep the existing one
        ins.run(kind, e.name, e.subtitle, e.body, JSON.stringify(e.stats), imp.id);
        imported++;
      }
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
    if (imported) hub.emit('blueprints');
    res.status(201).json({ imported, duplicates: chosen.length - imported });
  });
  return r;
}
