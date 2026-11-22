import fs from 'node:fs';
import { parseImport, formats, IMPORTERS } from '../lib/importers/index.js';
import { cleanBlueprint } from '../lib/blueprints.js';
import { stripTags, flatten } from '../lib/importers/text.js';

const fx = (n) => JSON.parse(fs.readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8'));
const stat = (e, t) => e.stats.find((s) => s.title === t)?.value;

describe('import menu', () => {
  it('offers at most three formats, each with kinds', () => {
    expect(formats().length).toBeLessThanOrEqual(3);
    expect(IMPORTERS.map((i) => i.id)).toEqual(['open5e', '5etools', 'ttrpg']);
    expect(formats().every((f) => f.kinds.length && f.label)).toBe(true);
  });
});

describe('open5e importer', () => {
  it('maps a monster and skips nameless records', () => {
    const { entries, skipped } = parseImport('open5e', 'creature', fx('open5e-monsters.json'));
    expect(entries).toHaveLength(1);
    expect(skipped).toBe(0); // nameless record is dropped before counting
    const g = entries[0];
    expect(g.subtitle).toBe('Small humanoid (goblinoid), neutral evil');
    expect(stat(g, 'Armor Class')).toBe('15 (leather armor, shield)');
    expect(stat(g, 'Speed')).toBe('walk 30 ft.');
    expect(stat(g, 'DEX')).toBe('14 (+2)');
    expect(g.body).toContain('Nimble Escape. Disengage');
  });
  it('maps weapons and magic items from a plain array', () => {
    const { entries } = parseImport('open5e', 'item', [{ name: 'Dagger', category: 'Simple Melee Weapons', cost: '2 gp', damage_dice: '1d4', damage_type: 'piercing', properties: ['finesse', 'light'] },
      { name: 'Wand', type: 'Wand', rarity: 'rare', requires_attunement: 'requires attunement', desc: 'Zap.' }]);
    expect(stat(entries[0], 'Damage')).toBe('1d4 piercing');
    expect(stat(entries[0], 'Properties')).toBe('finesse, light');
    expect(entries[1].subtitle).toBe('Wand, rare, requires attunement');
  });
  it('rejects other shapes', () => {
    expect(() => parseImport('open5e', 'creature', { monster: [] })).toThrow(/Open5e/);
  });
});

describe('5etools importer', () => {
  it('maps a monster, strips tags and skips _copy entries', () => {
    const { entries } = parseImport('5etools', 'creature', fx('5etools-bestiary.json'));
    expect(entries.map((e) => e.name)).toEqual(['Goblin']);
    const g = entries[0];
    expect(g.subtitle).toBe('Small humanoid, neutral evil');
    expect(stat(g, 'Armor Class')).toBe('15 (leather armor, shield)');
    expect(stat(g, 'Hit Points')).toBe('7 (2d6)');
    expect(g.body).toContain('+4 to hit, 1d6+2 slashing damage.');
  });
  it('maps items', () => {
    const { entries } = parseImport('5etools', 'item', fx('5etools-items.json'));
    expect(entries[0].subtitle).toBe('melee weapon');
    expect(stat(entries[0], 'Damage')).toBe('1d8 slashing');
    expect(stat(entries[0], 'Value')).toBe('15 gp');
    expect(entries[0].body).toBe('A longsword is versatile.');
    expect(entries[1].subtitle).toBe('ring, rare, requires attunement');
    expect(entries[1].body).toContain('• one');
  });
  it('rejects other shapes', () => {
    expect(() => parseImport('5etools', 'creature', { results: [] })).toThrow(/5etools/);
    expect(() => parseImport('5etools', 'creature', null)).toThrow(/5etools/);
  });
});

describe('native importer', () => {
  it('accepts stats as object or array, drops invalid ones, counts skipped', () => {
    const c = parseImport('ttrpg', 'creature', fx('ttrpg.json'));
    expect(c.entries[0].stats).toEqual([{ title: 'HP', value: '42' }, { title: 'AC', value: '11' }]);
    const i = parseImport('ttrpg', 'item', fx('ttrpg.json'));
    expect(i.entries).toHaveLength(1);
    expect(i.entries[0].stats).toEqual([{ title: 'Weight', value: '1 lb' }]);
  });
});

describe('parseImport validation', () => {
  it('rejects unknown format, kind and unsupported combinations', () => {
    expect(() => parseImport('nope', 'item', {})).toThrow(/format/);
    expect(() => parseImport('ttrpg', 'spell', {})).toThrow(/kind/);
  });
  it('clips oversize text instead of failing', () => {
    const { entries } = parseImport('ttrpg', 'item', { items: [{ name: 'x'.repeat(500), body: 'y'.repeat(50000) }] });
    expect(entries[0].name).toHaveLength(200);
    expect(entries[0].body).toHaveLength(12000);
  });
});

describe('cleanBlueprint / text helpers', () => {
  it('is strict by default', () => {
    expect(() => cleanBlueprint({ name: ' ' })).toThrow();
    expect(() => cleanBlueprint({ name: 'a', stats: 'x' })).toThrow();
    expect(() => cleanBlueprint({ name: 'a', stats: Array.from({ length: 41 }, () => ({ title: 't' })) })).toThrow();
    expect(cleanBlueprint({ name: ' a ' }).name).toBe('a');
  });
  it('strips 5etools tags and flattens entries', () => {
    expect(stripTags('{@damage 2d6} {@creature goblin|MM|goblins}')).toBe('2d6 goblins');
    expect(flatten([{ name: 'N', entries: ['t'] }])).toEqual(['N.', 't']);
  });
});
