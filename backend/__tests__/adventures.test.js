import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = './uploads';
process.env.UPLOAD_DIR = UPLOAD_DIR;
process.env.ALLOW_OVERWRITE = 'true';
process.env.BODY_LIMIT = '1mb';

import request from 'supertest';
import app from '../app.js';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR);
const ADVENTURE_FILENAME = 'adventure-alpha.json';
const MALFORMED_FILENAME = 'adventure-malformed.json';

const ADVENTURE_PAYLOAD = {
	metadata: {
		id: 'adv-alpha-001',
		title: 'Adventure Alpha',
		version: '1.0.0'
	},
	chapters: [
		{ id: 'ch-001', title: 'Arrival', summary: 'Start of the adventure' },
		{ id: 'ch-002', title: 'The Depths', summary: 'Middle section' }
	],
	npcs: [
		{ id: 'npc-001', name: 'Mira', role: 'Guide' },
		{ id: 'npc-002', name: 'Borin', role: 'Guard' }
	]
};

beforeAll(async () => {
	await fs.mkdir(uploadDir, { recursive: true });
	await fs.writeFile(
		path.join(uploadDir, ADVENTURE_FILENAME),
		JSON.stringify(ADVENTURE_PAYLOAD, null, 2),
		'utf8'
	);
	await fs.writeFile(
		path.join(uploadDir, MALFORMED_FILENAME),
		JSON.stringify({ metadata: { id: 'bad', title: 'Malformed Adventure' }, npcs: [] }, null, 2),
		'utf8'
	);
});

afterAll(async () => {
	await fs.rm(path.join(uploadDir, ADVENTURE_FILENAME), { force: true });
	await fs.rm(path.join(uploadDir, MALFORMED_FILENAME), { force: true });
});

test('GET /api/adventures/:adventureName/metadata returns metadata', async () => {
	const res = await request(app).get('/api/adventures/Adventure%20Alpha/metadata');
	expect(res.status).toBe(200);
	expect(res.body).toEqual({ metadata: ADVENTURE_PAYLOAD.metadata });
});

test('GET /api/adventures/:adventureName/chapters returns count and chapter preview list', async () => {
	const res = await request(app).get('/api/adventures/Adventure%20Alpha/chapters');
	expect(res.status).toBe(200);
	expect(res.body).toEqual({
		count: 2,
		chapters: [
			{ id: 'ch-001', title: 'Arrival' },
			{ id: 'ch-002', title: 'The Depths' }
		]
	});
});

test('GET /api/adventures/:adventureName/chapters/:chapterId returns single chapter', async () => {
	const res = await request(app).get('/api/adventures/Adventure%20Alpha/chapters/ch-002');
	expect(res.status).toBe(200);
	expect(res.body).toEqual({ chapter: ADVENTURE_PAYLOAD.chapters[1] });
});

test('GET /api/adventures/:adventureName/npcs returns count and npc preview list', async () => {
	const res = await request(app).get('/api/adventures/Adventure%20Alpha/npcs');
	expect(res.status).toBe(200);
	expect(res.body).toEqual({
		count: 2,
		npcs: [
			{ id: 'npc-001', name: 'Mira' },
			{ id: 'npc-002', name: 'Borin' }
		]
	});
});

test('GET /api/adventures/:adventureName/npcs/:npcId returns single npc', async () => {
	const res = await request(app).get('/api/adventures/Adventure%20Alpha/npcs/npc-001');
	expect(res.status).toBe(200);
	expect(res.body).toEqual({ npc: ADVENTURE_PAYLOAD.npcs[0] });
});

test('GET /api/adventures/:adventureName/metadata returns 404 for unknown adventure', async () => {
	const res = await request(app).get('/api/adventures/no-such-adventure/metadata');
	expect(res.status).toBe(404);
	expect(res.body).toHaveProperty('error');
});

test('GET /api/adventures/:adventureName/chapters/:chapterId returns 404 for unknown chapter', async () => {
	const res = await request(app).get('/api/adventures/Adventure%20Alpha/chapters/no-such-id');
	expect(res.status).toBe(404);
	expect(res.body).toHaveProperty('error', 'Chapter not found');
});

test('GET /api/adventures/:adventureName/npcs/:npcId returns 404 for unknown npc', async () => {
	const res = await request(app).get('/api/adventures/Adventure%20Alpha/npcs/no-such-id');
	expect(res.status).toBe(404);
	expect(res.body).toHaveProperty('error', 'NPC not found');
});

test('GET /api/adventures/:adventureName/chapters returns 422 for malformed chapters section', async () => {
	const res = await request(app).get('/api/adventures/Malformed%20Adventure/chapters');
	expect(res.status).toBe(422);
	expect(res.body).toHaveProperty('error');
});
