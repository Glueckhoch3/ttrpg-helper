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
  const payload = { foo: 'bar' };
  const meta = await processImport(payload, EXAMPLE_FILENAME);
  expect(meta).toHaveProperty('id');
  expect(meta).toHaveProperty('path');
});

test('processImport rejects non-object payload', async () => {
  await expect(processImport('string', 'f.json')).rejects.toHaveProperty('status');
});
