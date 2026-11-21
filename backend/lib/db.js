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
  symbol TEXT NOT NULL DEFAULT '●', label TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '#d32f2f',
  col INTEGER NOT NULL DEFAULT 0, row INTEGER NOT NULL DEFAULT 0, elevation INTEGER NOT NULL DEFAULT 0,
  size INTEGER NOT NULL DEFAULT 1, note TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS attachments(
  id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, file TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')));
`;

export function openDb(file = ':memory:') {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  // migration: maps.grid_locked (ADR-011)
  if (!db.prepare('PRAGMA table_info(maps)').all().some((c) => c.name === 'grid_locked'))
    db.exec('ALTER TABLE maps ADD COLUMN grid_locked INTEGER NOT NULL DEFAULT 0');
  return db;
}
