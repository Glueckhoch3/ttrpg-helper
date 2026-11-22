import { bad } from '../util.js';
import { cleanBlueprint, kindOf } from '../blueprints.js';
import open5e from './open5e.js';
import fivetools from './fivetools.js';
import native from './native.js';

// Import menu = this list (max. three formats, Issue #4). An importer is { id, label, description, kinds, parse(data, kind) -> raw entries[] }.
export const IMPORTERS = [open5e, fivetools, native];
export const MAX_IMPORT = 1000;

export const formats = () => IMPORTERS.map(({ id, label, description, kinds }) => ({ id, label, description, kinds }));

/** Parses + normalises (lenient) an uploaded file. Pure: no DB access. */
export function parseImport(formatId, kindRaw, data) {
  const imp = IMPORTERS.find((i) => i.id === formatId);
  if (!imp) throw bad(`format must be one of ${IMPORTERS.map((i) => i.id).join(', ')}`);
  const kind = kindOf(kindRaw);
  if (!imp.kinds.includes(kind)) throw bad(`${imp.id} cannot import ${kind}`);
  let raw;
  try { raw = imp.parse(data, kind); } catch (e) { if (e.status) throw e; throw bad(`Could not read ${imp.label} data`); }
  const entries = [];
  for (const r of raw) {
    try { const c = cleanBlueprint(r, { lenient: true }); if (c.name) entries.push({ kind, ...c }); } catch { /* skip malformed entry */ }
  }
  return { imp, kind, entries, skipped: raw.length - entries.length };
}
