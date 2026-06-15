// Ensure test env vars before importing service/config
import fs from 'node:fs/promises';
import path from 'node:path';
const UPLOAD_DIR = './uploads-savejson-service-test';
process.env.UPLOAD_DIR = UPLOAD_DIR;
process.env.ALLOW_OVERWRITE = 'true';
const EXAMPLE_FILENAME = 'example.json';
const ANOTHER_FILENAME = 'another.json';
import { processImport } from '../modules/savejson/service.js';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR);
const ADVENTURE_ID_FORMAT = /^adv-\d{3,}$/;

beforeAll(async () => {
  await fs.mkdir(uploadDir, { recursive: true });
});

afterAll(async () => {
  const filesToDelete = [EXAMPLE_FILENAME, ANOTHER_FILENAME];
  for (const filename of filesToDelete) {
    await fs.rm(path.join(uploadDir, filename), { force: true });
  }
});

test('processImport validates and returns metadata for valid object', async () => {
  const payload = { "metadata": {
    "id": "adv-001",
    "title": "Triefenhain",
    "version": "1.0",
    "author": "Leonhardit07 with Claude Sonnet 4.6",
    "summary": "A dark adventure set in and around the cursed village of Triefenhain. Ancient evils stir beneath the murky swamps, and the villagers live in fear of what lurks in the cave beyond the treeline."
  }, 
  "npcs": [],
  "chapters":[]};
  const meta = await processImport(payload, EXAMPLE_FILENAME);
  expect(meta).toHaveProperty('id');
  expect(meta).toHaveProperty('path');
  expect(meta).toHaveProperty('metadataId');
  expect(meta.metadataId).toMatch(ADVENTURE_ID_FORMAT);
});

test('processImport reassigns duplicate metadata id for a different file', async () => {
  const first = await processImport({ metadata: { id: 'adv-000' }, npcs: [], chapters: [] }, EXAMPLE_FILENAME);
  const result = await processImport({ metadata: { id: 'adv-000' }, npcs: [], chapters: [] }, ANOTHER_FILENAME);

  expect(result).toHaveProperty('metadataId');
  expect(result.metadataId).toMatch(ADVENTURE_ID_FORMAT);
  expect(result.metadataId).not.toBe(first.metadataId);
  const saved = JSON.parse(await fs.readFile(result.path, 'utf8'));
  expect(saved.metadata.id).toBe(result.metadataId);
});

test('processImport preserves metadata id when updating same file', async () => {
  const first = await processImport({ metadata: { id: 'adv-010' }, npcs: [], chapters: [] }, EXAMPLE_FILENAME);
  const result = await processImport({ metadata: { id: first.metadataId }, npcs: [{ id: 'npc-1' }], chapters: [] }, EXAMPLE_FILENAME);

  expect(result).toHaveProperty('metadataId', first.metadataId);
  const saved = JSON.parse(await fs.readFile(result.path, 'utf8'));
  expect(saved.metadata.id).toBe(first.metadataId);
});

test('processImport rejects non-object payload', async () => {
  await expect(processImport('string', 'f.json')).rejects.toHaveProperty('status');
});
