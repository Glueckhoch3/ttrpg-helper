import { toRaw } from "vue";

export function cloneValue(value) {
  return structuredClone(toRaw(value));
}

function nextSequentialId(prefix, items = []) {
  const numbers = items
    .map((item) => String(item?.id ?? ''))
    .map((id) => {
      const match = new RegExp(String.raw`^${prefix}-(\d+)$`).exec(id);
      return match ? Number(match[1]) : Number.NaN;
    })
    .filter((value) => Number.isFinite(value));

  const nextIndex = numbers.length > 0 ? Math.max(...numbers) + 1 : 0;
  return `${prefix}-${nextIndex}`;
}

export function createAdventureTemplate() {
  return {
    metadata: {
      id: '0',
      title: 'Template',
      version: '',
      author: '',
      summary: ''
    },
    npcs: [],
    chapters: []
  };
}

export function createChapterTemplate(chapters = []) {
  return {
    id: nextSequentialId('ch', chapters),
    title: 'template',
    summary: '',
    story: '',
    encounters: []
  };
}

export function createEncounterTemplate(encounters = []) {
  return {
    id: nextSequentialId('enc', encounters),
    type: 'template',
    description: ''
  };
}

export function createNpcTemplate(npcs = []) {
  return {
    id: nextSequentialId('npc', npcs),
    name: 'template',
    backstory: '',
    motivation: '',
    stats: {
      health: 1,
      strength: 1,
      dexterity: 1,
      intelligence: 1,
      wisdom: 1,
      charisma: 1
    }
  };
}

export function createAdventureFilename(title = 'template') {
  const slug = String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'adventure';

  return `${slug}-${Date.now()}.json`;
}
