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
  it('locked parts do not exist for players until unlocked', async () => {
    await request(app).post('/api/story').send({ title: 'Ch1', body: 'secret' }).expect(403);
    const p = (await request(app).post('/api/story').set(G(gm)).send({ title: 'Ch1 title', body: 'secret' }).expect(201)).body;
    let list = (await request(app).get('/api/story')).body;
    expect(list).toEqual([]);
    expect(JSON.stringify(list)).not.toMatch(/secret|Ch1/);
    await request(app).get(`/api/story/${p.id}`).expect(404);
    expect((await request(app).get('/api/story').set(G(gm))).body[0].body).toBe('secret');
    await request(app).post(`/api/story/${p.id}/unlock`).set(G(gm)).expect(200);
    list = (await request(app).get('/api/story')).body;
    expect(list[0].body).toBe('secret');
    await request(app).get(`/api/story/${p.id}`).expect(200);
    await request(app).post(`/api/story/${p.id}/lock`).set(G(gm)).expect(200);
    expect((await request(app).get('/api/story')).body).toEqual([]);
    await request(app).get(`/api/story/${p.id}`).expect(404);
  });
  it('reorders parts', async () => {
    const a = (await request(app).post('/api/story').set(G(gm)).send({ title: 'A' })).body;
    const b = (await request(app).post('/api/story').set(G(gm)).send({ title: 'B' })).body;
    await request(app).post('/api/story/reorder').set(G(gm)).send({ ids: [b.id, a.id] }).expect(200);
    expect((await request(app).get('/api/story').set(G(gm))).body.map((x) => x.title)).toEqual(['B', 'A']);
    await request(app).post('/api/story/reorder').set(G(gm)).send({ ids: [a.id] }).expect(400);
  });
});

describe('maps and tokens', () => {
  const mk = async () => {
    const r = await request(app).post('/api/maps?title=Cave&w=800&h=600').set(G(gm)).set('Content-Type', 'image/png').send(PNG);
    if (r.status === 201) {
      await request(app).post(`/api/maps/${r.body.id}/unlock`).set(G(gm));
      await request(app).patch(`/api/maps/${r.body.id}`).send({ grid_locked: true });
    }
    return r;
  };
  it('requires a locked grid for symbols and freezes the grid while locked', async () => {
    const m = (await request(app).post('/api/maps?title=x&w=800&h=600').set(G(gm)).set('Content-Type', 'image/png').send(PNG)).body;
    expect(m.grid_locked).toBe(0);
    await request(app).post(`/api/maps/${m.id}/unlock`).set(G(gm));
    await request(app).post(`/api/maps/${m.id}/tokens`).send({}).expect(409);
    await request(app).patch(`/api/maps/${m.id}`).send({ cell_px: 70, grid_locked: true }).expect(200);
    await request(app).patch(`/api/maps/${m.id}`).send({ cell_px: 80 }).expect(409);
    await request(app).patch(`/api/maps/${m.id}`).send({ title: 'renamed' }).expect(200);
    const t = (await request(app).post(`/api/maps/${m.id}/tokens`).send({ col: 1 }).expect(201)).body;
    await request(app).patch(`/api/maps/${m.id}`).send({ grid_locked: 'yes' }).expect(400);
    await request(app).patch(`/api/maps/${m.id}`).send({ grid_locked: false, cell_px: 90 }).expect(200);
    await request(app).patch(`/api/tokens/${t.id}`).send({ col: 2 }).expect(409);
    // symbols keep their cell coordinates when the grid is re-adjusted
    expect((await request(app).get(`/api/maps/${m.id}`)).body.tokens[0]).toMatchObject({ col: 1 });
  });
  it('uploads maps and validates', async () => {
    await request(app).post('/api/maps?title=x&w=1&h=1').set(G(gm)).set('Content-Type', 'image/png').send(Buffer.from('nope nope nope nope')).expect(400);
    await request(app).post('/api/maps?title=x').set(G(gm)).set('Content-Type', 'image/png').send(PNG).expect(400);
    const own = (await request(app).post('/api/maps?title=x&w=1&h=1').set('Content-Type', 'image/png').send(PNG).expect(201)).body;
    expect(own.unlocked).toBe(1); // a player's map is visible to the group; the GM may lock it
    const m = (await mk()).body;
    expect(m.grid_type).toBe('square');
  });
  it('calibrates grid', async () => {
    const m = (await mk()).body;
    await request(app).patch(`/api/maps/${m.id}`).send({ grid_type: 'hex' }).expect(409);
    await request(app).patch(`/api/maps/${m.id}`).send({ grid_locked: false }).expect(200);
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

describe('story tree (issue #2)', () => {
  const post = (url, body) => request(app).post(url).set(G(gm)).send(body);
  it('nests scenarios under snippets, limited to two layers', async () => {
    const town = (await post('/api/story', { title: 'Town', location: 'Riverside' }).expect(201)).body;
    const tavern = (await post('/api/story', { title: 'Tavern', parent_id: town.id }).expect(201)).body;
    expect(tavern.parent_id).toBe(town.id);
    await post('/api/story', { title: 'Cellar', parent_id: tavern.id }).expect(400);
    await post('/api/story', { title: 'x', parent_id: 999 }).expect(404);
  });
  it('hides scenarios while their snippet is locked', async () => {
    const town = (await post('/api/story', { title: 'Town' })).body;
    const tavern = (await post('/api/story', { title: 'Tavern', body: 'secret', parent_id: town.id })).body;
    await post(`/api/story/${tavern.id}/unlock`);
    expect((await request(app).get('/api/story')).body).toEqual([]);
    await request(app).get(`/api/story/${tavern.id}`).expect(404);
    await post(`/api/story/${town.id}/unlock`);
    expect((await request(app).get('/api/story')).body.map((p) => p.title)).toEqual(['Town', 'Tavern']);
  });
  it('reorders siblings per parent and cascades deletes', async () => {
    const t = (await post('/api/story', { title: 'T' })).body;
    const a = (await post('/api/story', { title: 'A', parent_id: t.id })).body;
    const b = (await post('/api/story', { title: 'B', parent_id: t.id })).body;
    await post('/api/story/reorder', { ids: [b.id, a.id], parent_id: t.id }).expect(200);
    const titles = (await request(app).get('/api/story').set(G(gm))).body.filter((p) => p.parent_id === t.id).map((p) => p.title);
    expect(titles).toEqual(['B', 'A']);
    await post('/api/story/reorder', { ids: [a.id] , parent_id: t.id }).expect(400);
    await request(app).delete(`/api/story/${t.id}`).set(G(gm)).expect(204);
    expect((await request(app).get('/api/story').set(G(gm))).body).toEqual([]);
  });
  it('links NPCs from the GM-only pool; players see names only', async () => {
    await request(app).get('/api/npcs').expect(403);
    const n = (await post('/api/npcs', { name: 'Mayor Bram', description: 'is the mayor', gm_notes: 'is the villain', hp: 20 }).expect(201)).body;
    const p = (await post('/api/story', { title: 'Town', npc_ids: [n.id] }).expect(201)).body;
    expect(p.npcs).toEqual([{ id: n.id, name: 'Mayor Bram' }]);
    await post('/api/story', { title: 'Bad', npc_ids: [999] }).expect(400);
    await post(`/api/story/${p.id}/unlock`);
    const seen = (await request(app).get('/api/story')).body[0];
    expect(seen.npcs[0].name).toBe('Mayor Bram');
    expect(JSON.stringify(seen)).not.toMatch(/villain/);
    await request(app).patch(`/api/story/${p.id}`).set(G(gm)).send({ npc_ids: [] }).expect(200);
    expect((await request(app).get('/api/story')).body[0].npcs).toEqual([]);
    await request(app).delete(`/api/npcs/${n.id}`).set(G(gm)).expect(204);
  });
});

describe('map locks and story/note links (issue #2)', () => {
  const upload = async () => (await request(app).post('/api/maps?title=Cave&w=800&h=600').set(G(gm)).set('Content-Type', 'image/png').send(PNG).expect(201)).body;
  it('new maps are hidden from players until the GM unlocks them', async () => {
    const m = await upload();
    expect(m.unlocked).toBe(0);
    expect((await request(app).get('/api/maps')).body).toEqual([]);
    expect((await request(app).get('/api/maps').set(G(gm))).body).toHaveLength(1);
    await request(app).get(`/api/maps/${m.id}`).expect(404);
    await request(app).get(`/api/files/${m.image_file}`).expect(404);
    await request(app).get(`/api/files/${m.image_file}`).set(G(gm)).expect(200);
    await request(app).post(`/api/maps/${m.id}/unlock`).expect(403);
    await request(app).post(`/api/maps/${m.id}/unlock`).set(G(gm)).expect(200);
    await request(app).get(`/api/maps/${m.id}`).expect(200);
    await request(app).get(`/api/files/${m.image_file}`).expect(200);
    await request(app).post(`/api/maps/${m.id}/lock`).set(G(gm)).expect(200);
    await request(app).get(`/api/maps/${m.id}`).expect(404);
  });
  it('maps uploaded by the GM start locked, by players unlocked', async () => {
    const pm = (await request(app).post('/api/maps?title=P&w=10&h=10').set('Content-Type', 'image/png').send(PNG).expect(201)).body;
    expect(pm.unlocked).toBe(1);
    await request(app).get(`/api/maps/${pm.id}`).expect(200);
  });
  it('a map linked in the story needs its own unlock', async () => {
    const m = await upload();
    const p = (await request(app).post('/api/story').set(G(gm)).send({ title: 'Cave', map_id: m.id }).expect(201)).body;
    expect(p.map).toMatchObject({ id: m.id, unlocked: false });
    await request(app).post(`/api/story/${p.id}/unlock`).set(G(gm));
    expect((await request(app).get('/api/story')).body[0]).toMatchObject({ map_id: null, map: null });
    await request(app).post(`/api/maps/${m.id}/unlock`).set(G(gm));
    expect((await request(app).get('/api/story')).body[0].map).toMatchObject({ id: m.id, title: 'Cave' });
    await request(app).post('/api/story').set(G(gm)).send({ title: 'x', map_id: 999 }).expect(400);
  });
  it('links notes to unlocked story parts only', async () => {
    const s = (await request(app).post('/api/sessions').send({ title: 'S' })).body;
    const n = (await request(app).post(`/api/sessions/${s.id}/notes`).send({ author: 'Ann', body: 'hi' })).body;
    const p = (await request(app).post('/api/story').set(G(gm)).send({ title: 'Tavern' })).body;
    await request(app).patch(`/api/notes/${n.id}`).send({ story_id: p.id }).expect(400);
    await request(app).post(`/api/story/${p.id}/unlock`).set(G(gm));
    const r = await request(app).patch(`/api/notes/${n.id}`).send({ story_id: p.id }).expect(200);
    expect(r.body).toMatchObject({ story_id: p.id, story_title: 'Tavern', body: 'hi' });
    expect((await request(app).get(`/api/sessions/${s.id}`)).body.notes[0].story_title).toBe('Tavern');
    await request(app).post(`/api/story/${p.id}/lock`).set(G(gm));
    expect((await request(app).get(`/api/sessions/${s.id}`)).body.notes[0]).toMatchObject({ story_id: null, story_title: null });
    expect((await request(app).get(`/api/sessions/${s.id}`).set(G(gm))).body.notes[0].story_title).toBe('Tavern');
    await request(app).patch(`/api/notes/${n.id}`).send({ story_id: null }).expect(200);
    await request(app).patch(`/api/notes/${n.id}`).send({}).expect(400);
  });
});

describe('NPC details (issue #2)', () => {
  const G2 = () => G(gm);
  it('shows players only public info of NPCs in visible story parts', async () => {
    const n = (await request(app).post('/api/npcs').set(G2()).send({ name: 'Bram', description: 'Tall mayor', gm_notes: 'villain', hp: 20 }).expect(201)).body;
    await request(app).post(`/api/npcs/${n.id}/stats`).set(G2()).send({ title: 'Armor', value: '15', visible: true }).expect(201);
    await request(app).post(`/api/npcs/${n.id}/stats`).set(G2()).send({ title: 'Secret', value: 'cultist' }).expect(201);
    const p = (await request(app).post('/api/story').set(G2()).send({ title: 'Town', npc_ids: [n.id] })).body;
    await request(app).get(`/api/npcs/${n.id}`).expect(404); // part still locked
    await request(app).post(`/api/story/${p.id}/unlock`).set(G2());
    const pub = (await request(app).get(`/api/npcs/${n.id}`).expect(200)).body;
    expect(pub).toEqual({ id: n.id, name: 'Bram', description: 'Tall mayor', stats: [{ title: 'Armor', value: '15' }] });
    expect(JSON.stringify(pub)).not.toMatch(/villain|hp|cultist/);
    expect((await request(app).get(`/api/npcs/${n.id}`).set(G2())).body).toMatchObject({ hp: 20, gm_notes: 'villain' });
  });
  it('edits HP and stats (GM only), max 8 stats, title max 32 chars', async () => {
    const n = (await request(app).post('/api/npcs').set(G2()).send({ name: 'X' })).body;
    await request(app).patch(`/api/npcs/${n.id}`).send({ hp: 5 }).expect(403);
    expect((await request(app).patch(`/api/npcs/${n.id}`).set(G2()).send({ hp: 9 }).expect(200)).body.hp).toBe(9);
    await request(app).patch(`/api/npcs/${n.id}`).set(G2()).send({ hp: 1.5 }).expect(400);
    await request(app).post(`/api/npcs/${n.id}/stats`).set(G2()).send({ title: 'x'.repeat(33) }).expect(400);
    let st;
    for (let i = 0; i < 8; i++) st = (await request(app).post(`/api/npcs/${n.id}/stats`).set(G2()).send({ title: `S${i}`, value: '1' }).expect(201)).body;
    await request(app).post(`/api/npcs/${n.id}/stats`).set(G2()).send({ title: 'ninth' }).expect(409);
    expect((await request(app).patch(`/api/npc-stats/${st.id}`).set(G2()).send({ value: '12' }).expect(200)).body.value).toBe('12');
    await request(app).delete(`/api/npc-stats/${st.id}`).set(G2()).expect(204);
    await request(app).post(`/api/npcs/${n.id}/stats`).set(G2()).send({ title: 'again' }).expect(201);
    expect((await request(app).get('/api/npcs').set(G2())).body[0].stats).toHaveLength(8);
  });
});

describe('blueprints and import (issue #4)', () => {
  const P = (body) => request(app).post('/api/blueprints').set(G(gm)).send(body);
  const GOBLIN = { kind: 'creature', name: 'Goblin', subtitle: 'Small humanoid', body: 'Sneaky.', stats: [{ title: 'HP', value: '7' }] };

  it('GM manages blueprints, players cannot list or edit', async () => {
    const b = (await P(GOBLIN).expect(201)).body;
    expect(b.stats).toEqual(GOBLIN.stats);
    await request(app).post('/api/blueprints').send(GOBLIN).expect(403);
    await request(app).get('/api/blueprints').expect(403);
    await request(app).patch(`/api/blueprints/${b.id}`).send({ name: 'x' }).expect(403);
    await request(app).delete(`/api/blueprints/${b.id}`).expect(403);
    await P({ ...GOBLIN, kind: 'spell' }).expect(400);
    await P({ kind: 'item', name: '' }).expect(400);
    const list = (await request(app).get('/api/blueprints?kind=creature').set(G(gm))).body;
    expect(list).toEqual([{ id: b.id, kind: 'creature', name: 'Goblin', subtitle: 'Small humanoid', source: 'manual' }]);
    expect((await request(app).get('/api/blueprints?kind=item').set(G(gm))).body).toEqual([]);
    await request(app).get('/api/blueprints?kind=bogus').set(G(gm)).expect(400);
    const p = (await request(app).patch(`/api/blueprints/${b.id}`).set(G(gm)).send({ name: 'Goblin Boss', kind: 'item' }).expect(200)).body;
    expect(p).toMatchObject({ name: 'Goblin Boss', kind: 'creature', body: 'Sneaky.' });
    await request(app).delete(`/api/blueprints/${b.id}`).set(G(gm)).expect(204);
    await request(app).get(`/api/blueprints/${b.id}`).set(G(gm)).expect(404);
  });

  describe('marker links', () => {
    let map, tok, item, creature, npc;
    const mkItem = async (name) => (await P({ kind: 'item', name }).expect(201)).body;
    beforeEach(async () => {
      map = (await request(app).post('/api/maps?title=M&w=100&h=100').set(G(gm)).set('Content-Type', 'image/png').send(PNG).expect(201)).body;
      await request(app).patch(`/api/maps/${map.id}`).set(G(gm)).send({ grid_locked: true }).expect(200);
      tok = (await request(app).post(`/api/maps/${map.id}/tokens`).set(G(gm)).send({ symbol: 'X' }).expect(201)).body;
      item = await mkItem('Sword');
      creature = (await P(GOBLIN)).body;
      npc = (await request(app).post('/api/npcs').set(G(gm)).send({ name: 'Bob', description: 'public' })).body;
    });
    const link = (body) => request(app).patch(`/api/tokens/${tok.id}`).set(G(gm)).send(body);

    it('links up to 5 items, one creature and one NPC; names come back', async () => {
      const r = (await link({ npc_id: npc.id, creature_id: creature.id, item_ids: [item.id] }).expect(200)).body;
      expect(r).toMatchObject({ npc: { id: npc.id, name: 'Bob' }, creature: { id: creature.id, name: 'Goblin' }, items: [{ id: item.id, name: 'Sword' }] });
      const m = (await request(app).get(`/api/maps/${map.id}`).set(G(gm))).body;
      expect(m.tokens[0].items).toHaveLength(1);
      const more = [item, ...(await Promise.all([1, 2, 3, 4].map((n) => mkItem(`I${n}`))))].map((i) => i.id);
      expect((await link({ item_ids: more }).expect(200)).body.items).toHaveLength(5);
      await link({ item_ids: [...more, (await mkItem('sixth')).id] }).expect(400);
      await link({ item_ids: [item.id, item.id] }).expect(400);
      expect((await link({ item_ids: [] }).expect(200)).body.items).toEqual([]);
      expect((await link({ creature_id: null, npc_id: null }).expect(200)).body).toMatchObject({ npc: null, creature: null });
    });
    it('checks the kinds and existence', async () => {
      await link({ creature_id: item.id }).expect(400);
      await link({ item_ids: [creature.id] }).expect(400);
      await link({ npc_id: 999 }).expect(400);
      await link({ item_ids: 'x' }).expect(400);
    });
    it('can link on create', async () => {
      const t = (await request(app).post(`/api/maps/${map.id}/tokens`).set(G(gm)).send({ creature_id: creature.id, item_ids: [item.id] }).expect(201)).body;
      expect(t.creature.name).toBe('Goblin');
      expect(t.items).toHaveLength(1);
    });
    it('players cannot set links', async () => {
      await request(app).post(`/api/maps/${map.id}/unlock`).set(G(gm)).expect(200);
      await request(app).patch(`/api/tokens/${tok.id}`).send({ npc_id: npc.id }).expect(403);
      await request(app).patch(`/api/tokens/${tok.id}`).send({ item_ids: [] }).expect(403);
      await request(app).patch(`/api/tokens/${tok.id}`).send({ label: 'ok' }).expect(200);
    });
    it('players see linked data only while the map is unlocked', async () => {
      await link({ npc_id: npc.id, creature_id: creature.id, item_ids: [item.id] }).expect(200);
      for (const u of [`/api/blueprints/${item.id}`, `/api/blueprints/${creature.id}`, `/api/npcs/${npc.id}`]) await request(app).get(u).expect(404);
      await request(app).post(`/api/maps/${map.id}/unlock`).set(G(gm)).expect(200);
      expect((await request(app).get(`/api/blueprints/${creature.id}`).expect(200)).body.stats).toEqual(GOBLIN.stats);
      await request(app).get(`/api/blueprints/${item.id}`).expect(200);
      expect((await request(app).get(`/api/npcs/${npc.id}`).expect(200)).body.name).toBe('Bob');
      const unlinked = await mkItem('Secret');
      await request(app).get(`/api/blueprints/${unlinked.id}`).expect(404);
      await request(app).post(`/api/maps/${map.id}/lock`).set(G(gm)).expect(200);
      await request(app).get(`/api/blueprints/${creature.id}`).expect(404);
    });
    it('deleting blueprints, NPCs or tokens cleans up the links', async () => {
      await link({ npc_id: npc.id, creature_id: creature.id, item_ids: [item.id] }).expect(200);
      await request(app).delete(`/api/blueprints/${item.id}`).set(G(gm)).expect(204);
      await request(app).delete(`/api/blueprints/${creature.id}`).set(G(gm)).expect(204);
      await request(app).delete(`/api/npcs/${npc.id}`).set(G(gm)).expect(204);
      const t = (await request(app).get(`/api/maps/${map.id}`).set(G(gm))).body.tokens[0];
      expect(t).toMatchObject({ npc: null, creature: null, items: [] });
      await request(app).delete(`/api/tokens/${tok.id}`).set(G(gm)).expect(204);
    });
  });

  describe('import', () => {
    const body = (extra = {}) => ({ format: 'ttrpg', kind: 'creature', data: { creatures: [{ name: 'A' }, { name: 'B' }, { name: 'a' }] }, ...extra });
    it('is GM only and lists up to three formats', async () => {
      await request(app).get('/api/import/formats').expect(403);
      await request(app).post('/api/import/preview').send(body()).expect(403);
      await request(app).post('/api/import').send(body()).expect(403);
      const f = (await request(app).get('/api/import/formats').set(G(gm)).expect(200)).body;
      expect(f.map((x) => x.id)).toEqual(['open5e', '5etools', 'ttrpg']);
    });
    it('previews without saving, then imports the chosen entries and skips duplicates', async () => {
      const pv = (await request(app).post('/api/import/preview').set(G(gm)).send(body()).expect(200)).body;
      expect(pv.entries.map((e) => e.name)).toEqual(['A', 'B', 'a']);
      expect((await request(app).get('/api/blueprints').set(G(gm))).body).toEqual([]);
      const r = (await request(app).post('/api/import').set(G(gm)).send(body({ indexes: [0, 1, 2, 2, 99] })).expect(201)).body;
      expect(r).toEqual({ imported: 2, duplicates: 1 });
      const list = (await request(app).get('/api/blueprints').set(G(gm))).body;
      expect(list.map((x) => x.source)).toEqual(['ttrpg', 'ttrpg']);
      const again = (await request(app).post('/api/import/preview').set(G(gm)).send(body()).expect(200)).body;
      expect(again.entries.map((e) => e.duplicate)).toEqual([true, true, true]);
      expect((await request(app).post('/api/import').set(G(gm)).send(body()).expect(201)).body).toEqual({ imported: 0, duplicates: 3 });
    });
    it('imports everything without indexes and handles a large (>1 MB) file', async () => {
      const creatures = Array.from({ length: 300 }, (_, i) => ({ name: `C${i}`, body: 'x'.repeat(5000) }));
      const r = await request(app).post('/api/import').set(G(gm)).send({ format: 'ttrpg', kind: 'creature', data: { creatures } }).expect(201);
      expect(r.body.imported).toBe(300);
    });
    it('rejects bad input', async () => {
      await request(app).post('/api/import').set(G(gm)).send(body({ format: 'x' })).expect(400);
      await request(app).post('/api/import').set(G(gm)).send(body({ kind: 'x' })).expect(400);
      await request(app).post('/api/import').set(G(gm)).send(body({ data: { items: [] } })).expect(400);
      await request(app).post('/api/import').set(G(gm)).send(body({ indexes: 'all' })).expect(400);
      await request(app).post('/api/import').set(G(gm)).send(body({ data: null })).expect(400);
    });
    it('keeps the 1 MB limit elsewhere', async () => {
      await request(app).post('/api/npcs').set(G(gm)).send({ name: 'x', description: 'y'.repeat(1.2e6) }).expect(413);
    });
  });
});
