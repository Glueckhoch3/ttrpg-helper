// Helpers shared by the importers.

/** "{@creature goblin|MM|Goblins}" -> "Goblins"; "{@damage 1d6}" -> "1d6"; "{@hit 4}" -> "+4". */
export function stripTags(s) {
  return String(s)
    .replace(/\{@hit (-?\d+)[^}]*\}/g, (_, n) => (Number(n) >= 0 ? `+${n}` : n))
    .replace(/\{@\w+ ([^}]*)\}/g, (_, inner) => { const p = inner.split('|'); return (p[2] || p[0]).trim(); });
}

/** Flattens 5etools-style `entries` (strings, nested {entries}, {items} lists, tables ignored) into plain paragraphs. */
export function flatten(entries, depth = 0) {
  if (entries == null || depth > 6) return [];
  if (typeof entries === 'string') return [stripTags(entries)];
  if (Array.isArray(entries)) return entries.flatMap((e) => flatten(e, depth + 1));
  if (typeof entries !== 'object') return [];
  const out = [];
  if (entries.name && entries.entries) out.push(`${stripTags(entries.name)}.`);
  if (Array.isArray(entries.entries)) out.push(...flatten(entries.entries, depth + 1));
  if (Array.isArray(entries.items)) out.push(...entries.items.flatMap((i) => (typeof i === 'string' ? [`• ${stripTags(i)}`] : flatten(i, depth + 1))));
  return out;
}

/** [{name, desc|entries}] -> "Name. text" paragraphs under an optional heading. */
export function namedBlocks(list, heading, textOf) {
  if (!Array.isArray(list) || !list.length) return '';
  const lines = list.filter((x) => x && typeof x === 'object' && x.name).map((x) => `${stripTags(x.name)}. ${textOf(x)}`.trim());
  return lines.length ? `${heading}\n${lines.join('\n')}` : '';
}

export const mod = (score) => (Number.isFinite(score) ? `${score} (${Math.floor((score - 10) / 2) >= 0 ? '+' : ''}${Math.floor((score - 10) / 2)})` : '');
export const present = (...pairs) => pairs.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '').map(([title, v]) => ({ title, value: String(v) }));
export const records = (list) => (Array.isArray(list) ? list.filter((r) => r && typeof r === 'object' && typeof r.name === 'string' && r.name.trim()) : []);
