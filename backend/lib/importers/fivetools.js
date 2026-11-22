import { bad } from '../util.js';
import { flatten, mod, namedBlocks, present, records, stripTags } from './text.js';

const SIZE = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan' };
const ALIGN = { L: 'lawful', N: 'neutral', C: 'chaotic', G: 'good', E: 'evil', U: 'unaligned', A: 'any alignment', NX: 'neutral', NY: 'neutral' };
const RARITY = { none: '', common: 'common', uncommon: 'uncommon', rare: 'rare', 'very rare': 'very rare', legendary: 'legendary', artifact: 'artifact' };
const ITEM_TYPE = { M: 'melee weapon', R: 'ranged weapon', LA: 'light armor', MA: 'medium armor', HA: 'heavy armor', S: 'shield', P: 'potion', RD: 'rod', RG: 'ring', SC: 'scroll', WD: 'wand', A: 'ammunition', G: 'adventuring gear', W: 'wondrous item' };
const DMG = { P: 'piercing', S: 'slashing', B: 'bludgeoning', F: 'fire', C: 'cold', L: 'lightning', N: 'necrotic', R: 'radiant', O: 'force', Y: 'psychic', A: 'acid', T: 'thunder', I: 'poison' };
const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const typeText = (t) => (typeof t === 'string' ? t : typeof t?.type === 'string' ? t.type : 'creature');
const acText = (ac) => (Array.isArray(ac) ? ac.map((a) => (typeof a === 'object' ? `${a.ac}${a.from ? ` (${a.from.map(stripTags).join(', ')})` : ''}` : a)).join(', ') : ac);
const speedText = (s) => (s && typeof s === 'object' ? Object.entries(s).filter(([k]) => k !== 'canHover')
  .map(([k, v]) => `${k} ${typeof v === 'object' ? v.number : v} ft.`).join(', ') : undefined);
const crText = (cr) => (typeof cr === 'object' ? cr?.cr : cr);
const block = (list, heading) => namedBlocks(list, heading, (x) => flatten(x.entries).join(' '));
const dmgList = (a) => (Array.isArray(a) ? a.map((x) => (typeof x === 'string' ? x : x.special ?? (x.resist ?? x.immune ?? []).join?.(', '))).join(', ') : undefined);

function creature(m) {
  const align = Array.isArray(m.alignment) ? m.alignment.map((a) => ALIGN[a] ?? '').filter(Boolean).join(' ') : '';
  const size = Array.isArray(m.size) ? m.size.map((s) => SIZE[s] ?? s).join('/') : '';
  return {
    name: m.name,
    subtitle: [[size, typeText(m.type)].filter(Boolean).join(' '), align].filter(Boolean).join(', '),
    body: [block(m.trait, 'Traits'), block(m.action, 'Actions'), block(m.bonus, 'Bonus Actions'), block(m.reaction, 'Reactions'), block(m.legendary, 'Legendary Actions')].filter(Boolean).join('\n\n'),
    stats: present(
      ['Armor Class', acText(m.ac)],
      ['Hit Points', m.hp ? `${m.hp.average ?? ''}${m.hp.formula ? ` (${m.hp.formula})` : ''}`.trim() : undefined],
      ['Speed', speedText(m.speed)],
      ...ABILITIES.map((a) => [a.toUpperCase(), mod(m[a])]),
      ['Challenge', crText(m.cr)], ['Senses', Array.isArray(m.senses) ? m.senses.join(', ') : undefined],
      ['Languages', Array.isArray(m.languages) ? m.languages.join(', ') : undefined],
      ['Resistances', dmgList(m.resist)], ['Immunities', dmgList(m.immune)],
    ),
  };
}

function item(i) {
  const attune = i.reqAttune ? `requires attunement${typeof i.reqAttune === 'string' ? ` ${i.reqAttune}` : ''}` : '';
  const type = ITEM_TYPE[String(i.type ?? '').split('|')[0]] ?? (i.wondrous ? 'wondrous item' : '');
  const rarity = RARITY[i.rarity] ?? i.rarity ?? '';
  return {
    name: i.name,
    subtitle: [type, rarity, attune].filter(Boolean).join(', '),
    body: flatten(i.entries).join('\n'),
    stats: present(['Damage', i.dmg1 ? `${i.dmg1} ${DMG[i.dmgType] ?? i.dmgType ?? ''}`.trim() : undefined],
      ['Armor Class', i.ac], ['Weight', i.weight !== undefined ? `${i.weight} lb.` : undefined],
      ['Value', i.value !== undefined ? `${i.value / 100} gp` : undefined]),
  };
}

export default {
  id: '5etools',
  label: '5etools JSON',
  description: 'Data files from the 5etools data folder (e.g. bestiary-mm.json with "monster", items.json with "item"). Check the licence of your source before sharing.',
  kinds: ['creature', 'item'],
  parse(data, kind) {
    const key = kind === 'creature' ? ['monster'] : ['item', 'baseitem'];
    const lists = key.map((k) => data?.[k]).filter(Array.isArray);
    if (!lists.length) throw bad(`Not 5etools JSON: expected a "${key[0]}" array`);
    // entries that only copy another creature (_copy) carry no data of their own
    return records(lists.flat()).filter((r) => !r._copy).map(kind === 'creature' ? creature : item);
  },
};
