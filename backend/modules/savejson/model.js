import fs from 'node:fs/promises';
import path from 'node:path';
import sanitize from 'sanitize-filename';
import { UPLOAD_DIR } from '../../config/index.js';

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function saveJson(obj, filename) {
  await ensureDir(UPLOAD_DIR);

  const name = filename && filename.trim().length > 0 ? filename : "";
  const safeName = sanitize(name);
  if (!safeName || safeName.length === 0) {
    throw Object.assign(new Error('Invalid filename after sanitization'), { status: 400 });
  }

  // Prevent path traversal by using basename and sanitize
  const destPath = path.resolve(UPLOAD_DIR, path.basename(safeName));

  const data = JSON.stringify(obj, null, 2);
  // debug: log paths to help test diagnostics
  console.log('saveJson UPLOAD_DIR=', UPLOAD_DIR, 'destPath=', destPath);
  await fs.writeFile(destPath, data, { encoding: 'utf8' });
  console.log('saveJson completed write for', destPath);

  return { id: path.basename(destPath), path: destPath };
}

export async function readJson(filename) {
  if (!filename || String(filename).trim().length === 0) {
    throw Object.assign(new Error('Filename required'), { status: 400 });
  }

  const safeName = sanitize(String(filename));
  if (!safeName || safeName.length === 0) {
    throw Object.assign(new Error('Invalid filename after sanitization'), { status: 400 });
  }

  const destPath = path.resolve(UPLOAD_DIR, path.basename(safeName));

  try {
    const data = await fs.readFile(destPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e?.code === 'ENOENT') {
      const err = new Error('File not found');
      err.status = 404;
      throw err;
    }
    throw e;
  }
}
