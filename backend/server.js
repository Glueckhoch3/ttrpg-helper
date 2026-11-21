import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { openDb } from './lib/db.js';
import { createApp } from './app.js';
import { PORT, HOST, DATA_DIR, GM_PIN, GROUP_PASSWORD } from './config.js';

const db = openDb(path.join(DATA_DIR, 'ttrpg.sqlite'));
// Secrets from env, else generated once and kept in the DB
function secret(key, fromEnv, gen) {
  if (fromEnv) return fromEnv;
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key);
  if (row) return row.value;
  const v = gen();
  db.prepare('INSERT INTO settings(key,value) VALUES(?,?)').run(key, v);
  return v;
}
const pin = secret('gm_pin', GM_PIN, () => String(crypto.randomInt(100000, 1000000)));
const groupPassword = secret('group_password', GROUP_PASSWORD, () => crypto.randomBytes(4).toString('hex'));
const app = createApp({
  db, gmPin: pin, groupPassword,
  filesDir: path.join(DATA_DIR, 'files'),
  staticDir: path.resolve(import.meta.dirname, '../frontend/dist'),
});
const server = app.listen(PORT, HOST, () => {
  console.log(`TTRPG helper running. GM PIN: ${pin}`);
  console.log(`Group password: ${groupPassword}`);
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list ?? []) if (i.family === 'IPv4' && !i.internal) console.log(`  Group URL: http://${i.address}:${PORT}`);
});
const stop = () => { app.locals.hub.close(); server.close(() => process.exit(0)); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
