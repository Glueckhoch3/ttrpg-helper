// Ensure test env vars before importing service/config
import fs from 'node:fs/promises';
import path from 'node:path';
const UPLOAD_DIR = './uploads-adventures-test';
process.env.UPLOAD_DIR = UPLOAD_DIR;
process.env.ALLOW_OVERWRITE = 'true';
const EXAMPLE_FILENAME = 'example.json';
import { processImport } from '../modules/savejson/service.js';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR);

beforeAll(async () => {
  await fs.mkdir(uploadDir, { recursive: true });
});

afterAll(async () => {
  try {
    const examplePath = path.join(uploadDir, EXAMPLE_FILENAME);
    await fs.unlink(examplePath).catch(() => {});
  } catch (e) {
    // ignore
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
});

test('processImport rejects non-object payload', async () => {
  await expect(processImport('string', 'f.json')).rejects.toHaveProperty('status');
});
