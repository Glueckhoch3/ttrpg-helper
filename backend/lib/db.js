import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(
  id INTEGER PRIMARY KEY, number INTEGER, title TEXT NOT NULL, played_on TEXT, summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS notes(
  id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT);
CREATE TABLE IF NOT EXISTS story_parts(
  id INTEGER PRIMARY KEY, position INTEGER NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
  unlocked INTEGER NOT NULL DEFAULT 0, unlocked_at TEXT);
CREATE TABLE IF NOT EXISTS maps(
  id INTEGER PRIMARY KEY, title TEXT NOT NULL, image_file TEXT NOT NULL, img_w INTEGER NOT NULL, img_h INTEGER NOT NULL,
  grid_type TEXT NOT NULL DEFAULT 'square', cell_px REAL NOT NULL DEFAULT 50, offset_x REAL NOT NULL DEFAULT 0,
  offset_y REAL NOT NULL DEFAULT 0, session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS tokens(
  id INTEGER PRIMARY KEY, map_id INTEGER NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL DEFAULT '●', label TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '#D55E00',
  col INTEGER NOT NULL DEFAULT 0, row INTEGER NOT NULL DEFAULT 0, elevation INTEGER NOT NULL DEFAULT 0,
  size INTEGER NOT NULL DEFAULT 1, note TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS attachments(
  id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, file TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS npcs(
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS npc_stats(
  id INTEGER PRIMARY KEY, npc_id INTEGER NOT NULL REFERENCES npcs(id) ON DELETE CASCADE, position INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL, value TEXT NOT NULL DEFAULT '', visible INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS story_npcs(
  story_id INTEGER NOT NULL REFERENCES story_parts(id) ON DELETE CASCADE,
  npc_id INTEGER NOT NULL REFERENCES npcs(id) ON DELETE CASCADE, PRIMARY KEY(story_id, npc_id));
`;

function addColumn(db, table, col, ddl) {
  if (db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col)) return false;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
  return true;
}

export function openDb(file = ':memory:') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  // migrations
  addColumn(db, 'maps', 'grid_locked', 'INTEGER NOT NULL DEFAULT 0'); // ADR-011
  // ADR-013: new maps start hidden; maps that existed before stay visible
  if (addColumn(db, 'maps', 'unlocked', 'INTEGER NOT NULL DEFAULT 0')) db.exec('UPDATE maps SET unlocked=1');
  addColumn(db, 'story_parts', 'parent_id', 'INTEGER REFERENCES story_parts(id) ON DELETE CASCADE');
  addColumn(db, 'story_parts', 'location', "TEXT NOT NULL DEFAULT ''");
  addColumn(db, 'story_parts', 'map_id', 'INTEGER REFERENCES maps(id) ON DELETE SET NULL');
  addColumn(db, 'npcs', 'hp', 'INTEGER NOT NULL DEFAULT 0'); // GM-only health
  addColumn(db, 'npcs', 'gm_notes', "TEXT NOT NULL DEFAULT ''"); // GM-only; `description` is public
  addColumn(db, 'notes', 'story_id', 'INTEGER REFERENCES story_parts(id) ON DELETE SET NULL');
  return db;
}
