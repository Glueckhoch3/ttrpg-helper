import crypto from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const bad = (m) => new HttpError(400, m);
export const notFound = (m = 'Not found') => new HttpError(404, m);

export const str = (v, name, { max = 20000, required = true } = {}) => {
  if (v === undefined || v === null) { if (required) throw bad(`${name} is required`); return undefined; }
  if (typeof v !== 'string') throw bad(`${name} must be a string`);
  const t = v.trim();
  if (required && !t) throw bad(`${name} must not be empty`);
  if (t.length > max) throw bad(`${name} too long`);
  return t;
};
export const int = (v, name, { min = -1e6, max = 1e6 } = {}) => {
  if (!Number.isInteger(v) || v < min || v > max) throw bad(`${name} must be an integer ${min}..${max}`);
  return v;
};
export const num = (v, name, { min = -1e6, max = 1e6 } = {}) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw bad(`${name} must be a number ${min}..${max}`);
  return v;
};

// Build "SET a=?, b=?" from the provided (validated) fields only.
export function patch(db, table, id, fields) {
  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
  if (!keys.length) throw bad('No fields to update');
  db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(', ')} WHERE id=?`).run(...keys.map((k) => fields[k]), id);
}

export const safeEqual = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

const MAGIC = [
  ['image/png', 'png', [0x89, 0x50, 0x4e, 0x47]],
  ['image/jpeg', 'jpg', [0xff, 0xd8, 0xff]],
  ['image/webp', 'webp', null],
  ['application/pdf', 'pdf', [0x25, 0x50, 0x44, 0x46]],
];
export function sniff(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  for (const [mime, ext, sig] of MAGIC) {
    if (sig ? sig.every((b, i) => buf[i] === b)
            : buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { mime, ext };
  }
  return null;
}
