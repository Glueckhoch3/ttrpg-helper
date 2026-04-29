import fs from 'fs/promises';
import path from 'path';

// Ensure test env vars before importing app/config
process.env.UPLOAD_DIR = './backend_test_uploads';
process.env.ALLOW_OVERWRITE = 'true';
process.env.BODY_LIMIT = '1mb';

import request from 'supertest';
import app from '../app.js';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR);

beforeAll(async () => {
  await fs.mkdir(uploadDir, { recursive: true });
});

afterAll(async () => {
  // cleanup test upload dir
  try {
    const files = await fs.readdir(uploadDir);
    await Promise.all(files.map(f => fs.unlink(path.join(uploadDir, f))));
    await fs.rmdir(uploadDir);
  } catch (e) {
    // ignore
  }
});

test('GET /health returns status ok', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('status', 'ok');
});

test('POST /api/import accepts valid JSON and saves file', async () => {
  const payload = { name: 'test', items: [1, 2, 3] };
  const res = await request(app)
    .post('/api/import')
    .query({ filename: 'test1.json' })
    .send(payload)
    .set('Content-Type', 'application/json');

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('id');
  const saved = await fs.readFile(path.join(uploadDir, res.body.id), 'utf8');
  const parsed = JSON.parse(saved);
  expect(parsed).toEqual(payload);
});

test('POST /api/import rejects invalid payload (non-object root)', async () => {
  const payload = 'this is a string';
  const res = await request(app)
    .post('/api/import')
    .send(payload)
    .set('Content-Type', 'application/json');

  // Parsing string as JSON will succeed if quoted, but schema requires object root
  expect([400, 415, 422]).toContain(res.status);
});
