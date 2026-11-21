import supertest from 'supertest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDb } from '../lib/db.js';
import { createApp } from '../app.js';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
let app, gm;
const raw = supertest;
const request = (a) => {
  const agent = supertest(a);
  return new Proxy(agent, { get: (t, m) => (...args) => { const r = t[m](...args); return COOKIE.v && m !== 'join' ? r.set('Cookie', COOKIE.v) : r; } });
};
// Every request carries the member cookie, like a logged-in browser.
const COOKIE = {};
beforeEach(async () => {
  app = createApp({ db: openDb(':memory:'), gmPin: '1234', groupPassword: 'pw', filesDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ttrpg-')) });
  const join = await raw(app).post('/api/auth/join').send({ password: 'pw' });
  COOKIE.v = join.headers['set-cookie'][0].split(';')[0];
  gm = (await request(app).post('/api/auth/gm').send({ pin: '1234' })).body.token;
});
const G = (t) => ({ Authorization: `Bearer ${t}` });

describe('group password', () => {
  it('blocks the API without cookie and accepts the right password', async () => {
    await raw(app).get('/api/sessions').expect(401);
    await raw(app).get('/api/health').expect(200);
    await raw(app).post('/api/auth/join').send({ password: 'nope' }).expect(401);
    await raw(app).get('/api/sessions').set('Cookie', COOKIE.v).expect(200);
    await raw(app).get('/api/files/x.png').expect(401);
  });
  it('GM login needs membership', async () => {
    await raw(app).post('/api/auth/gm').send({ pin: '1234' }).expect(401);
  });
});

describe('auth', () => {
  it('rejects a wrong PIN', async () => {
    await request(app).post('/api/auth/gm').send({ pin: 'x' }).expect(401);
  });
  it('reports gm status', async () => {
    expect((await request(app).get('/api/auth/me').set(G(gm))).body.gm).toBe(true);
    expect((await request(app).get('/api/auth/me')).body.gm).toBe(false);
  });
});

describe('sessions and notes', () => {
  it('creates sessions with auto numbering and notes', async () => {
    const s = (await request(app).post('/api/sessions').send({ title: 'Start' }).expect(201)).body;
    expect(s.number).toBe(1);
    await request(app).post(`/api/sessions/${s.id}/notes`).send({ author: 'Ann', body: 'We met a dragon' }).expect(201);
    const full = (await request(app).get(`/api/sessions/${s.id}`)).body;
    expect(full.notes).toHaveLength(1);
    expect((await request(app).post('/api/sessions').send({ title: 'Two' })).body.number).toBe(2);
  });
  it('validates input', async () => {
    await request(app).post('/api/sessions').send({}).expect(400);
    await request(app).get('/api/sessions/999').expect(404);
  });
  it('only GM may delete sessions', async () => {
    const s = (await request(app).post('/api/sessions').send({ title: 'x' })).body;
    await request(app).delete(`/api/sessions/${s.id}`).expect(403);
    await request(app).delete(`/api/sessions/${s.id}`).set(G(gm)).expect(204);
  });
  it('stores attachments with magic-byte check', async () => {
    const s = (await request(app).post('/api/sessions').send({ title: 'x' })).body;
    await request(app).post(`/api/sessions/${s.id}/attachments`).set('Content-Type', 'image/png').send(Buffer.from('not an image at all')).expect(400);
    const a = (await request(app).post(`/api/sessions/${s.id}/attachments?title=Map`).set('Content-Type', 'image/png').send(PNG).expect(201)).body;
    await request(app).get(`/api/files/${a.file}`).expect(200);
    await request(app).get('/api/files/..%2Fsecret').expect(400);
  });
});

describe('story', () => {
  it('hides locked parts from players until unlocked', async () => {
    await request(app).post('/api/story').send({ title: 'Ch1', body: 'secret' }).expect(403);
    const p = (await request(app).post('/api/story').set(G(gm)).send({ title: 'Ch1', body: 'secret' }).expect(201)).body;
    let list = (await request(app).get('/api/story')).body;
    expect(list[0].body).toBeNull();
    expect(JSON.stringify(list)).not.toContain('secret');
    await request(app).get(`/api/story/${p.id}`).expect(200).then((r) => expect(r.body.body).toBeNull());
    expect((await request(app).get('/api/story').set(G(gm))).body[0].body).toBe('secret');
    await request(app).post(`/api/story/${p.id}/unlock`).set(G(gm)).expect(200);
    list = (await request(app).get('/api/story')).body;
    expect(list[0].body).toBe('secret');
    await request(app).post(`/api/story/${p.id}/lock`).set(G(gm)).expect(200);
    expect((await request(app).get('/api/story')).body[0].body).toBeNull();
  });
  it('reorders parts', async () => {
    const a = (await request(app).post('/api/story').set(G(gm)).send({ title: 'A' })).body;
    const b = (await request(app).post('/api/story').set(G(gm)).send({ title: 'B' })).body;
    await request(app).post('/api/story/reorder').set(G(gm)).send({ ids: [b.id, a.id] }).expect(200);
    expect((await request(app).get('/api/story')).body.map((x) => x.title)).toEqual(['B', 'A']);
    await request(app).post('/api/story/reorder').set(G(gm)).send({ ids: [a.id] }).expect(400);
  });
});

describe('maps and tokens', () => {
  const mk = () => request(app).post('/api/maps?title=Cave&w=800&h=600').set('Content-Type', 'image/png').send(PNG);
  it('uploads maps and validates', async () => {
    await request(app).post('/api/maps?title=x&w=1&h=1').set('Content-Type', 'image/png').send(Buffer.from('nope nope nope nope')).expect(400);
    await request(app).post('/api/maps?title=x').set('Content-Type', 'image/png').send(PNG).expect(400);
    const m = (await mk().expect(201)).body;
    expect(m.grid_type).toBe('square');
  });
  it('calibrates grid', async () => {
    const m = (await mk()).body;
    const r = await request(app).patch(`/api/maps/${m.id}`).send({ grid_type: 'hex', cell_px: 64, offset_x: 5 }).expect(200);
    expect(r.body).toMatchObject({ grid_type: 'hex', cell_px: 64, offset_x: 5 });
    await request(app).patch(`/api/maps/${m.id}`).send({ grid_type: 'tri' }).expect(400);
    await request(app).patch(`/api/maps/${m.id}`).send({ cell_px: 1 }).expect(400);
  });
  it('manages tokens with elevation', async () => {
    const m = (await mk()).body;
    const t = (await request(app).post(`/api/maps/${m.id}/tokens`).send({ symbol: '🐉', col: 2, row: 3, elevation: 10 }).expect(201)).body;
    expect(t).toMatchObject({ col: 2, row: 3, elevation: 10, size: 1 });
    await request(app).patch(`/api/tokens/${t.id}`).send({ elevation: -5, label: 'Dragon', color: '#00ff00' }).expect(200);
    await request(app).patch(`/api/tokens/${t.id}`).send({ elevation: 1.5 }).expect(400);
    await request(app).patch(`/api/tokens/${t.id}`).send({ color: 'red' }).expect(400);
    expect((await request(app).get(`/api/maps/${m.id}`)).body.tokens[0]).toMatchObject({ elevation: -5, label: 'Dragon' });
    await request(app).delete(`/api/tokens/${t.id}`).expect(204);
  });
  it('deleting a map removes tokens (GM only)', async () => {
    const m = (await mk()).body;
    await request(app).post(`/api/maps/${m.id}/tokens`).send({}).expect(201);
    await request(app).delete(`/api/maps/${m.id}`).expect(403);
    await request(app).delete(`/api/maps/${m.id}`).set(G(gm)).expect(204);
    await request(app).get(`/api/maps/${m.id}`).expect(404);
  });
});
