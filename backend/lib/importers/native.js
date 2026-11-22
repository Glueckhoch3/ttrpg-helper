import { bad } from '../util.js';
import { records } from './text.js';

// Own minimal format, documented in docs/import-formats.md. Use it to convert any other source.
export default {
  id: 'ttrpg',
  label: 'TTRPG Helper JSON',
  description: 'Simple own format: {"creatures":[{name, subtitle, body, stats:[{title,value}]}], "items":[…]}. See docs/import-formats.md.',
  kinds: ['creature', 'item'],
  parse(data, kind) {
    const key = kind === 'creature' ? 'creatures' : 'items';
    if (!Array.isArray(data?.[key])) throw bad(`Not TTRPG Helper JSON: expected a "${key}" array`);
    return records(data[key]);
  },
};
