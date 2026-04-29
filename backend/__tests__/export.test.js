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
  await fs.rm(examplePath, { force: true });
});

test('GET /api/export returns stored JSON previously uploaded', async () => {
  const payload = { hello: 'world', list: [ 'a', 'b', 'c' ] };

  // create via import endpoint
  const filename = EXAMPLE_FILENAME;
  const post = await request(app)
    .post('/api/import')
    .query({ filename })
    .send(payload)
    .set('Content-Type', 'application/json');

  expect(post.status).toBe(201);
  expect(post.body).toHaveProperty('id');

  const id = post.body.id;

  const get = await request(app).get('/api/export').query({ filename: id });
  expect(get.status).toBe(200);
  expect(get.body).toEqual(payload);
});

test('GET /api/export returns 404 for missing file', async () => {
  const res = await request(app).get('/api/export').query({ filename: 'no-such-file.json' });
  expect(res.status).toBe(404);
});
