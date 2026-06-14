import fs from 'node:fs/promises';
import path from 'node:path';

// Ensure test env vars before importing app/config
const UPLOAD_DIR = './uploads-savejson-test';
process.env.UPLOAD_DIR = UPLOAD_DIR;
process.env.ALLOW_OVERWRITE = 'true';
process.env.BODY_LIMIT = '1mb';
const EXAMPLE_FILENAME = 'example.json';
const DUPLICATE_FILENAME = 'duplicate.json';

import request from 'supertest';
import app from '../app.js';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR);
const ADVENTURE_ID_FORMAT = /^adv-\d{3,}$/;

beforeAll(async () => {
  await fs.mkdir(uploadDir, { recursive: true });
});

afterAll(async () => {
  const filesToDelete = [EXAMPLE_FILENAME, DUPLICATE_FILENAME];
  for (const filename of filesToDelete) {
    await fs.rm(path.join(uploadDir, filename), { force: true });
  }
});

test('GET /health returns status ok', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('status', 'ok');
});

test('POST /api/save accepts valid JSON and saves file', async () => {
  const payload = { "metadata": {
    "id": "adv-001",
    "title": "Triefenhain",
    "version": "1.0",
    "author": "Leonhardit07 with Claude Sonnet 4.6",
    "summary": "A dark adventure set in and around the cursed village of Triefenhain. Ancient evils stir beneath the murky swamps, and the villagers live in fear of what lurks in the cave beyond the treeline."
  }, 
  "npcs": [],
  "chapters":[]};
  const filename = EXAMPLE_FILENAME;
  const res = await request(app)
    .post('/api/save')
    .query({ filename })
    .send(payload)
    .set('Content-Type', 'application/json');

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('id');
  expect(res.body).toHaveProperty('metadataId');
  expect(res.body.metadataId).toMatch(ADVENTURE_ID_FORMAT);
  const saved = await fs.readFile(res.body.path, 'utf8');
  const parsed = JSON.parse(saved);
  expect(parsed.metadata.id).toBe(res.body.metadataId);
});

test('POST /api/save overwrites existing file content', async () => {
  const filename = EXAMPLE_FILENAME;
  const initialPayload = { metadata: { id: 'adv-010' }, npcs: [], chapters: [] };

  const firstSave = await request(app)
    .post('/api/save')
    .query({ filename })
    .send(initialPayload)
    .set('Content-Type', 'application/json');
  expect(firstSave.status).toBe(201);
  const persistedId = firstSave.body.metadataId;

  const updatedPayload = { metadata: { id: persistedId }, npcs: [{ id: 'npc-1' }], chapters: [] };

  const secondSave = await request(app)
    .post('/api/save')
    .query({ filename })
    .send(updatedPayload)
    .set('Content-Type', 'application/json');
  expect(secondSave.status).toBe(201);
  expect(secondSave.body).toHaveProperty('metadataId', persistedId);

  const saved = await fs.readFile(secondSave.body.path, 'utf8');
  expect(JSON.parse(saved)).toEqual(updatedPayload);
});

test('POST /api/save reassigns duplicate metadata id for another filename', async () => {
  const firstPayload = { metadata: { id: 'adv-000' }, npcs: [], chapters: [] };
  const duplicatePayload = { metadata: { id: 'adv-000' }, npcs: [], chapters: [] };

  const first = await request(app)
    .post('/api/save')
    .query({ filename: EXAMPLE_FILENAME })
    .send(firstPayload)
    .set('Content-Type', 'application/json');

  expect(first.status).toBe(201);
  expect(first.body).toHaveProperty('metadataId');
  expect(first.body.metadataId).toMatch(ADVENTURE_ID_FORMAT);

  const second = await request(app)
    .post('/api/save')
    .query({ filename: DUPLICATE_FILENAME })
    .send(duplicatePayload)
    .set('Content-Type', 'application/json');

  expect(second.status).toBe(201);
  expect(second.body).toHaveProperty('metadataId');
  expect(second.body.metadataId).toMatch(ADVENTURE_ID_FORMAT);
  expect(second.body.metadataId).not.toBe(first.body.metadataId);

  const secondSaved = JSON.parse(
    await fs.readFile(second.body.path, 'utf8')
  );
  expect(secondSaved.metadata.id).toBe(second.body.metadataId);
});

test('POST /api/save rejects invalid payload (non-object root)', async () => {
  const payload = 'this is a string';
  const res = await request(app)
    .post('/api/save')
    .send(payload)
    .set('Content-Type', 'application/json');

  // Parsing string as JSON will succeed if quoted, but schema requires object root
  expect([400, 415, 422]).toContain(res.status);
});
