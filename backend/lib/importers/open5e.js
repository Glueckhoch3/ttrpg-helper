import { bad } from '../util.js';
import { mod, namedBlocks, present, records } from './text.js';

const speedText = (s) => (s && typeof s === 'object' ? Object.entries(s).map(([k, v]) => `${k} ${v} ft.`).join(', ') : s);
const ABILITIES = [['STR', 'strength'], ['DEX', 'dexterity'], ['CON', 'constitution'], ['INT', 'intelligence'], ['WIS', 'wisdom'], ['CHA', 'charisma']];

function creature(m) {
  const sub = [m.size, m.type && m.subtype ? `${m.type} (${m.subtype})` : m.type].filter(Boolean).join(' ');
  const body = [
    namedBlocks(m.special_abilities, 'Traits', (x) => x.desc ?? ''),
    namedBlocks(m.actions, 'Actions', (x) => x.desc ?? ''),
    namedBlocks(m.reactions, 'Reactions', (x) => x.desc ?? ''),
    namedBlocks(m.legendary_actions, 'Legendary Actions', (x) => x.desc ?? ''),
  ].filter(Boolean).join('\n\n');
  return {
    name: m.name,
    subtitle: [sub, m.alignment].filter(Boolean).join(', '),
    body,
    stats: present(
      ['Armor Class', m.armor_class !== undefined ? `${m.armor_class}${m.armor_desc ? ` (${m.armor_desc})` : ''}` : ''],
      ['Hit Points', m.hit_points !== undefined ? `${m.hit_points}${m.hit_dice ? ` (${m.hit_dice})` : ''}` : ''],
      ['Speed', speedText(m.speed)],
      ...ABILITIES.map(([t, k]) => [t, mod(m[k])]),
      ['Challenge', m.challenge_rating], ['Senses', m.senses], ['Languages', m.languages],
      ['Vulnerabilities', m.damage_vulnerabilities], ['Resistances', m.damage_resistances],
      ['Immunities', m.damage_immunities], ['Condition Immunities', m.condition_immunities],
    ),
  };
}

// Open5e serves magic items, weapons and armor from different endpoints; fields are told apart by presence.
function item(i) {
  const attune = i.requires_attunement && i.requires_attunement !== 'no' ? 'requires attunement' : '';
  const dmg = i.damage_dice ? `${i.damage_dice}${i.damage_type ? ` ${i.damage_type}` : ''}` : '';
  const props = Array.isArray(i.properties) ? i.properties.join(', ') : i.properties;
  return {
    name: i.name,
    subtitle: [i.type ?? i.category, i.rarity, attune].filter(Boolean).join(', '),
    body: i.desc ?? '',
    stats: present(['Cost', i.cost], ['Damage', dmg], ['Properties', props], ['Armor Class', i.ac_string ?? i.base_ac], ['Weight', i.weight],
      ['Stealth', i.stealth_disadvantage ? 'Disadvantage' : undefined], ['Strength', i.strength_requirement]),
  };
}

export default {
  id: 'open5e',
  label: 'Open5e (SRD API JSON)',
  description: 'JSON saved from api.open5e.com (e.g. /v1/monsters/?limit=500, /v1/magicitems/, /v1/weapons/, /v1/armor/). Open game content (SRD).',
  kinds: ['creature', 'item'],
  parse(data, kind) {
    const list = Array.isArray(data) ? data : data?.results;
    if (!Array.isArray(list)) throw bad('Not Open5e JSON: expected a "results" array');
    return records(list).map(kind === 'creature' ? creature : item);
  },
};
