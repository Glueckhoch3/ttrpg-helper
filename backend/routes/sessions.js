import { Router } from 'express';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { bad, notFound, str, int, patch, sniff } from '../lib/util.js';

export default function sessionsRoutes({ db, hub, auth, filesDir }) {
  const r = Router();
  const getSession = (id) => db.prepare('SELECT * FROM sessions WHERE id=?').get(id) ?? (() => { throw notFound('Session not found'); })();
  const getNote = (id) => db.prepare('SELECT * FROM notes WHERE id=?').get(id) ?? (() => { throw notFound('Note not found'); })();

  r.get('/sessions', (req, res) => {
    res.json(db.prepare('SELECT * FROM sessions ORDER BY COALESCE(number,0) DESC, id DESC').all());
  });
  r.post('/sessions', (req, res) => {
    const b = req.body ?? {};
    const number = b.number === undefined ? (db.prepare('SELECT COALESCE(MAX(number),0)+1 AS n FROM sessions').get().n) : int(b.number, 'number', { min: 0 });
    const info = db.prepare('INSERT INTO sessions(number,title,played_on,summary) VALUES(?,?,?,?)')
      .run(number, str(b.title, 'title', { max: 200 }), str(b.played_on, 'played_on', { max: 20, required: false }) ?? null, str(b.summary, 'summary', { required: false }) ?? '');
    hub.emit('sessions');
    res.status(201).json(getSession(info.lastInsertRowid));
  });
  r.get('/sessions/:id', (req, res) => {
    const s = getSession(req.params.id);
    res.json({
      ...s,
      notes: db.prepare('SELECT * FROM notes WHERE session_id=? ORDER BY id').all(s.id),
      attachments: db.prepare('SELECT * FROM attachments WHERE session_id=? ORDER BY id').all(s.id),
    });
  });
  r.patch('/sessions/:id', (req, res) => {
    const s = getSession(req.params.id);
    const b = req.body ?? {};
    patch(db, 'sessions', s.id, {
      title: b.title === undefined ? undefined : str(b.title, 'title', { max: 200 }),
      number: b.number === undefined ? undefined : int(b.number, 'number', { min: 0 }),
      played_on: b.played_on === undefined ? undefined : str(b.played_on, 'played_on', { max: 20, required: false }) ?? null,
      summary: b.summary === undefined ? undefined : str(b.summary, 'summary', { required: false }) ?? '',
    });
    hub.emit('sessions', s.id);
    res.json(getSession(s.id));
  });
  r.delete('/sessions/:id', auth.requireGm, (req, res) => {
    const s = getSession(req.params.id);
    db.prepare('DELETE FROM sessions WHERE id=?').run(s.id);
    hub.emit('sessions', s.id);
    res.status(204).end();
  });

  // Notes: open to every group member
  r.post('/sessions/:id/notes', (req, res) => {
    const s = getSession(req.params.id);
    const b = req.body ?? {};
    const info = db.prepare('INSERT INTO notes(session_id,author,body) VALUES(?,?,?)')
      .run(s.id, str(b.author, 'author', { max: 60 }), str(b.body, 'body'));
    hub.emit('notes', s.id);
    res.status(201).json(getNote(info.lastInsertRowid));
  });
  r.patch('/notes/:id', (req, res) => {
    const n = getNote(req.params.id);
    patch(db, 'notes', n.id, { body: str(req.body?.body, 'body'), updated_at: new Date().toISOString() });
    hub.emit('notes', n.session_id);
    res.json(getNote(n.id));
  });
  r.delete('/notes/:id', (req, res) => {
    const n = getNote(req.params.id);
    db.prepare('DELETE FROM notes WHERE id=?').run(n.id);
    hub.emit('notes', n.session_id);
    res.status(204).end();
  });

  // Attachments (e.g. exported map PNG), raw binary body
  const raw = express.raw({ type: () => true, limit: '25mb' });
  r.post('/sessions/:id/attachments', raw, (req, res) => {
    const s = getSession(req.params.id);
    const type = sniff(req.body);
    if (!type) throw bad('Unsupported file type (png, jpg, webp, pdf)');
    const file = `${crypto.randomUUID()}.${type.ext}`;
    fs.writeFileSync(path.join(filesDir, file), req.body);
    const kind = type.mime === 'application/pdf' ? 'pdf' : 'image';
    const info = db.prepare('INSERT INTO attachments(session_id,kind,file,title) VALUES(?,?,?,?)')
      .run(s.id, kind, file, str(req.query.title, 'title', { max: 200, required: false }) ?? '');
    hub.emit('notes', s.id);
    res.status(201).json(db.prepare('SELECT * FROM attachments WHERE id=?').get(info.lastInsertRowid));
  });
  r.delete('/attachments/:id', (req, res) => {
    const a = db.prepare('SELECT * FROM attachments WHERE id=?').get(req.params.id);
    if (!a) throw notFound();
    db.prepare('DELETE FROM attachments WHERE id=?').run(a.id);
    fs.rmSync(path.join(filesDir, a.file), { force: true });
    hub.emit('notes', a.session_id);
    res.status(204).end();
  });
  return r;
}
