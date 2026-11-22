import { bad } from './util.js';

// Blueprint = reusable item/creature data (ADR-014). Add 'spell' here (and a branch in each importer) for Issue "Improved Maps#5".
export const KINDS = ['item', 'creature'];
export const MAX_STATS = 40;
const LIM = { name: 200, subtitle: 200, body: 12000, title: 40, value: 300 };

const clip = (v, max) => String(v ?? '').trim().slice(0, max);

/**
 * Normalise a blueprint draft. strict (API input): invalid data -> 400. lenient (imports): clip and drop junk instead,
 * so one odd entry in a big file never aborts the whole import.
 */
export function cleanBlueprint(raw, { lenient = false } = {}) {
  const b = raw ?? {};
  const text = (v, name, max, required = false) => {
    if (lenient) return clip(v, max);
    if (v === undefined || v === null) { if (required) throw bad(`${name} is required`); return ''; }
    if (typeof v !== 'string') throw bad(`${name} must be a string`);
    const t = v.trim();
    if (required && !t) throw bad(`${name} must not be empty`);
    if (t.length > max) throw bad(`${name} too long`);
    return t;
  };
  let stats = b.stats ?? [];
  if (!Array.isArray(stats)) {
    if (lenient && stats && typeof stats === 'object') stats = Object.entries(stats).map(([title, value]) => ({ title, value }));
    else throw bad('stats must be an array of {title, value}');
  }
  if (!lenient && stats.length > MAX_STATS) throw bad(`At most ${MAX_STATS} stat fields`);
  const out = [];
  for (const s of stats) {
    if (!s || typeof s !== 'object') { if (lenient) continue; throw bad('stats must be an array of {title, value}'); }
    const title = text(s.title, 'stat title', LIM.title, true);
    if (lenient && !title) continue;
    out.push({ title, value: text(s.value, 'stat value', LIM.value) });
  }
  return {
    name: text(b.name, 'name', LIM.name, true),
    subtitle: text(b.subtitle, 'subtitle', LIM.subtitle),
    body: text(b.body, 'body', LIM.body),
    stats: out.slice(0, MAX_STATS),
  };
}

export const kindOf = (v) => {
  if (!KINDS.includes(v)) throw bad(`kind must be one of ${KINDS.join(', ')}`);
  return v;
};

export const parseRow = (r) => ({ ...r, stats: JSON.parse(r.stats) });
