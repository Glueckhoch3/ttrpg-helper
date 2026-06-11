import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = './uploads-adventures-test';
process.env.UPLOAD_DIR = UPLOAD_DIR;
process.env.ALLOW_OVERWRITE = 'true';
process.env.BODY_LIMIT = '1mb';

import request from 'supertest';
const { default: app } = await import('../app.js');

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR);
const ADVENTURE_FILENAME = 'adventure-alpha.json';
const ADVENTURE_TWO_FILENAME = 'adventure-beta.json';
const MALFORMED_CHAPTERS_FILENAME = 'adventure-malformed-chapters.json';
const MALFORMED_NPCS_FILENAME = 'adventure-malformed-npcs.json';
const MALFORMED_JSON_FILENAME = 'adventure-bad-json.json';
const ADVENTURE_STEM = 'adventure-alpha';

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

const ADVENTURE_TWO_PAYLOAD = {
	metadata: {
		id: 'adv-beta-001',
		title: 'Adventure Beta',
		version: '1.1.0'
	},
	chapters: [{ id: 'beta-01', title: 'First Steps', summary: 'Start beta adventure' }],
	npcs: [{ id: 'beta-npc-01', name: 'Nox', role: 'Scout' }]
};

beforeAll(async () => {
	await fs.mkdir(uploadDir, { recursive: true });
	await fs.writeFile(
		path.join(uploadDir, ADVENTURE_FILENAME),
		JSON.stringify(ADVENTURE_PAYLOAD, null, 2),
		'utf8'
	);
	await fs.writeFile(
		path.join(uploadDir, ADVENTURE_TWO_FILENAME),
		JSON.stringify(ADVENTURE_TWO_PAYLOAD, null, 2),
		'utf8'
	);
	await fs.writeFile(
		path.join(uploadDir, MALFORMED_CHAPTERS_FILENAME),
		JSON.stringify({ metadata: { id: 'bad', title: 'Malformed Adventure' }, npcs: [] }, null, 2),
		'utf8'
	);
	await fs.writeFile(
		path.join(uploadDir, MALFORMED_NPCS_FILENAME),
		JSON.stringify({ metadata: { title: 'Malformed Npcs' }, chapters: [], npcs: {} }, null, 2),
		'utf8'
	);
	await fs.writeFile(path.join(uploadDir, MALFORMED_JSON_FILENAME), '{ "metadata": { "title": ', 'utf8');
});

afterAll(async () => {
	await fs.rm(uploadDir, { recursive: true, force: true });
});

test('GET /api/adventures returns filename and metadata list and skips malformed JSON files', async () => {
	const res = await request(app).get('/api/adventures');
	expect(res.status).toBe(200);
	expect(res.body).toEqual({
		adventures: [
			{ filename: ADVENTURE_FILENAME, metadata: { id: 'adv-alpha-001', title: 'Adventure Alpha', version: '1.0.0' } },
			{ filename: ADVENTURE_TWO_FILENAME, metadata: { id: 'adv-beta-001', title: 'Adventure Beta', version: '1.1.0' } },
			{ filename: MALFORMED_CHAPTERS_FILENAME, metadata: { id: 'bad', title: 'Malformed Adventure' } },
			{ filename: MALFORMED_NPCS_FILENAME, metadata: { title: 'Malformed Npcs' } }
		]
	});
});

test('GET /api/adventures returns every discovered adventure filename', async () => {
	const res = await request(app).get('/api/adventures');
	expect(res.status).toBe(200);
	expect(res.body.adventures.map((item) => item.filename)).toEqual([
		ADVENTURE_FILENAME,
		ADVENTURE_TWO_FILENAME,
		MALFORMED_CHAPTERS_FILENAME,
		MALFORMED_NPCS_FILENAME
	]);
});

test('GET /api/adventures/:adventureFile/metadata returns metadata', async () => {
	const res = await request(app).get(`/api/adventures/${ADVENTURE_STEM}/metadata`);
	expect(res.status).toBe(200);
	expect(res.body).toEqual({ metadata: ADVENTURE_PAYLOAD.metadata });
});

test('GET /api/adventures/:adventureFile/chapters returns count and chapter preview list', async () => {
	const res = await request(app).get(`/api/adventures/${ADVENTURE_STEM}/chapters`);
	expect(res.status).toBe(200);
	expect(res.body).toEqual({
		count: 2,
		chapters: [
			{ id: 'ch-001', title: 'Arrival' },
			{ id: 'ch-002', title: 'The Depths' }
		]
	});
});

test('GET /api/adventures/:adventureFile/chapters/:chapterId returns single chapter', async () => {
	const res = await request(app).get(`/api/adventures/${ADVENTURE_STEM}/chapters/ch-002`);
	expect(res.status).toBe(200);
	expect(res.body).toEqual({ chapter: ADVENTURE_PAYLOAD.chapters[1] });
});

test('GET /api/adventures/:adventureFile/npcs returns count and npc preview list', async () => {
	const res = await request(app).get(`/api/adventures/${ADVENTURE_STEM}/npcs`);
	expect(res.status).toBe(200);
	expect(res.body).toEqual({
		count: 2,
		npcs: [
			{ id: 'npc-001', name: 'Mira' },
			{ id: 'npc-002', name: 'Borin' }
		]
	});
});

test('GET /api/adventures/:adventureFile/npcs/:npcId returns single npc', async () => {
	const res = await request(app).get(`/api/adventures/${ADVENTURE_STEM}/npcs/npc-001`);
	expect(res.status).toBe(200);
	expect(res.body).toEqual({ npc: ADVENTURE_PAYLOAD.npcs[0] });
});

test('GET /api/adventures/:adventureFile/metadata returns 404 for unknown adventure', async () => {
	const res = await request(app).get('/api/adventures/no-such-adventure/metadata');
	expect(res.status).toBe(404);
	expect(res.body).toHaveProperty('error');
});

test('GET /api/adventures/:adventureFile/chapters/:chapterId returns 404 for unknown chapter', async () => {
	const res = await request(app).get(`/api/adventures/${ADVENTURE_STEM}/chapters/no-such-id`);
	expect(res.status).toBe(404);
	expect(res.body).toHaveProperty('error', 'Chapter not found');
});

test('GET /api/adventures/:adventureFile/npcs/:npcId returns 404 for unknown npc', async () => {
	const res = await request(app).get(`/api/adventures/${ADVENTURE_STEM}/npcs/no-such-id`);
	expect(res.status).toBe(404);
	expect(res.body).toHaveProperty('error', 'NPC not found');
});

test('GET /api/adventures/:adventureFile/chapters returns 422 for malformed chapters section', async () => {
	const res = await request(app).get('/api/adventures/adventure-malformed-chapters/chapters');
	expect(res.status).toBe(422);
	expect(res.body).toHaveProperty('error');
});

test('GET /api/adventures/:adventureFile/npcs returns 422 for malformed npcs section', async () => {
	const res = await request(app).get('/api/adventures/adventure-malformed-npcs/npcs');
	expect(res.status).toBe(422);
	expect(res.body).toHaveProperty('error');
});

test('GET /api/adventures/:adventureFile/metadata returns 400 for whitespace-only adventure filename', async () => {
	const res = await request(app).get('/api/adventures/%20/metadata');
	expect(res.status).toBe(400);
	expect(res.body).toHaveProperty('error');
});

test('GET /api/adventures/:adventureFile/chapters/:chapterId returns 400 for whitespace-only chapterId', async () => {
	const res = await request(app).get(`/api/adventures/${ADVENTURE_STEM}/chapters/%20`);
	expect(res.status).toBe(400);
	expect(res.body).toHaveProperty('error');
});

test('GET /api/adventures/:adventureFile/npcs/:npcId returns 400 for whitespace-only npcId', async () => {
	const res = await request(app).get(`/api/adventures/${ADVENTURE_STEM}/npcs/%20`);
	expect(res.status).toBe(400);
	expect(res.body).toHaveProperty('error');
});

test('GET /api/adventures/:adventureFile/metadata returns 400 if filename includes .json', async () => {
	const res = await request(app).get('/api/adventures/adventure-alpha.json/metadata');
	expect(res.status).toBe(400);
	expect(res.body).toHaveProperty('error');
});
