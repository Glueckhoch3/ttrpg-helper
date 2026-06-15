import { toRaw } from "vue";

const ADVENTURE_ID_PREFIX = 'adv';
const ADVENTURE_ID_PATTERN = /^adv-(\d+)$/;
const ADVENTURE_ID_PADDING = 3;
const CHAPTER_ID_PATTERN = /^ch-(\d+)$/;
const NPC_ID_PATTERN = /^npc-(\d+)$/;
const CHAPTER_ID_PADDING = 3;
const NPC_ID_PADDING = 3;
const ENCOUNTER_ID_PADDING = 2;

function toPlainValue(value) {
  const rawValue = toRaw(value);

  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => toPlainValue(item));
  }

  if (rawValue && typeof rawValue === 'object') {
    return Object.fromEntries(
      Object.entries(rawValue).map(([key, nestedValue]) => [key, toPlainValue(nestedValue)])
    );
  }

  return rawValue;
}

export function cloneValue(value) {
  return structuredClone(toPlainValue(value));
}

function nextPaddedId(items, idPattern, prefix, padding) {
  const numbers = items
    .map((item) => String(item?.id ?? ''))
    .map((id) => {
      const match = idPattern.exec(id);
      return match ? Number(match[1]) : Number.NaN;
    })
    .filter((value) => Number.isFinite(value));

  const nextIndex = numbers.length > 0 ? Math.max(...numbers) + 1 : 0;
  return `${prefix}-${String(nextIndex).padStart(padding, '0')}`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseAdventureSequence(id) {
  const match = ADVENTURE_ID_PATTERN.exec(String(id ?? '').trim());
  if (!match) {
    return Number.NaN;
  }

  return Number(match[1]);
}

function formatAdventureId(sequence) {
  return `${ADVENTURE_ID_PREFIX}-${String(sequence).padStart(ADVENTURE_ID_PADDING, '0')}`;
}

export function nextAdventureId(adventures = []) {
  const usedSequences = adventures
    .map((adventure) => parseAdventureSequence(adventure?.metadata?.id))
    .filter((sequence) => Number.isFinite(sequence));

  const nextSequence = usedSequences.length > 0 ? Math.max(...usedSequences) + 1 : 0;
  return formatAdventureId(nextSequence);
}

export function createAdventureTemplate(adventureId = formatAdventureId(0)) {
  return {
    metadata: {
      id: adventureId,
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
    id: nextPaddedId(chapters, CHAPTER_ID_PATTERN, 'ch', CHAPTER_ID_PADDING),
    title: 'template',
    summary: '',
    story: '',
    encounters: []
  };
}

export function createEncounterTemplate(chapterId = '', encounters = []) {
  const normalizedChapterId = String(chapterId ?? '').trim() || 'ch-000';
  const encounterIdPattern = new RegExp(`^enc-${escapeRegex(normalizedChapterId)}-(\\d+)$`);
  const nextEncounterId = nextPaddedId(encounters, encounterIdPattern, `enc-${normalizedChapterId}`, ENCOUNTER_ID_PADDING);

  return {
    id: nextEncounterId,
    type: 'template',
    description: ''
  };
}

export function createNpcTemplate(npcs = []) {
  return {
    id: nextPaddedId(npcs, NPC_ID_PATTERN, 'npc', NPC_ID_PADDING),
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
