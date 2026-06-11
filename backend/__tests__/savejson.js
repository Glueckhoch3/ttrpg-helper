import fs from 'node:fs/promises';
import path from 'node:path';

// Ensure test env vars before importing app/config
const UPLOAD_DIR = './uploads';
process.env.UPLOAD_DIR = UPLOAD_DIR;
process.env.ALLOW_OVERWRITE = 'true';
process.env.BODY_LIMIT = '1mb';
const EXAMPLE_FILENAME = 'example.json';

import request from 'supertest';
import app from '../app.js';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR);

beforeAll(async () => {
  await fs.mkdir(uploadDir, { recursive: true });
});

afterAll(async () => {
  const examplePath = path.join(uploadDir, EXAMPLE_FILENAME);
  await fs.unlink(examplePath).catch(() => {});
});

test('GET /health returns status ok', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('status', 'ok');
});

test('POST /api/save accepts valid JSON and saves file', async () => {
  const payload = { "metadata": {
    "id": "adv-triefenhain-001",
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
  const saved = await fs.readFile(path.join(uploadDir, res.body.id), 'utf8');
  const parsed = JSON.parse(saved);
  expect(parsed).toEqual(payload);
});

test('POST /api/save overwrites existing file content', async () => {
  const filename = EXAMPLE_FILENAME;
  const initialPayload = { metadata: { id: 'adv-initial' }, npcs: [], chapters: [] };
  const updatedPayload = { metadata: { id: 'adv-updated' }, npcs: [{ id: 'npc-1' }], chapters: [] };

  const firstSave = await request(app)
    .post('/api/save')
    .query({ filename })
    .send(initialPayload)
    .set('Content-Type', 'application/json');
  expect(firstSave.status).toBe(201);

  const secondSave = await request(app)
    .post('/api/save')
    .query({ filename })
    .send(updatedPayload)
    .set('Content-Type', 'application/json');
  expect(secondSave.status).toBe(201);

  const saved = await fs.readFile(path.join(uploadDir, filename), 'utf8');
  expect(JSON.parse(saved)).toEqual(updatedPayload);
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
