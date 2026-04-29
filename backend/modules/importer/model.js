import fs from 'fs/promises';
import path from 'path';
import sanitize from 'sanitize-filename';
import { UPLOAD_DIR, ALLOW_OVERWRITE } from '../../config/index.js';

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

export async function saveJson(obj, filename) {
  await ensureDir(UPLOAD_DIR);

  const name = filename && filename.trim().length > 0 ? filename : `upload-${Date.now()}.json`;
  const safeName = sanitize(name);
  if (!safeName || safeName.length === 0) {
    throw Object.assign(new Error('Invalid filename after sanitization'), { status: 400 });
  }

  // Prevent path traversal by using basename and sanitize
  const destPath = path.resolve(UPLOAD_DIR, path.basename(safeName));

  // Check overwrite
  try {
    const stat = await fs.stat(destPath).catch(() => null);
    if (stat && !ALLOW_OVERWRITE) {
      const err = new Error('File exists and overwrite is disabled');
      err.status = 409;
      throw err;
    }
  } catch (e) {
    throw e;
  }

  const data = JSON.stringify(obj, null, 2);
  await fs.writeFile(destPath, data, { encoding: 'utf8' });

  return { id: path.basename(destPath), path: destPath };
}
