import { readAdventureJson } from './model.js';

function requireString(value, fieldName) {
	if (!value || String(value).trim().length === 0) {
		const err = new Error(`${fieldName} is required`);
		err.status = 400;
		throw err;
	}
	return String(value).trim();
}

function ensureObjectField(obj, fieldName) {
	const value = obj[fieldName];
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		const err = new Error(`Adventure ${fieldName} is missing or invalid`);
		err.status = 422;
		throw err;
	}
	return value;
}

function ensureArrayField(obj, fieldName) {
	const value = obj[fieldName];
	if (!Array.isArray(value)) {
		const err = new Error(`Adventure ${fieldName} is missing or invalid`);
		err.status = 422;
		throw err;
	}
	return value;
}

export async function getMetadata(adventureName) {
	const adventure = await readAdventureJson(adventureName);
	const metadata = ensureObjectField(adventure, 'metadata');
	return { metadata };
}

export async function getChapters(adventureName) {
	const adventure = await readAdventureJson(adventureName);
	const chapters = ensureArrayField(adventure, 'chapters');

	const chapterList = chapters.map((chapter) => ({
		id: chapter?.id ?? null,
		title: chapter?.title ?? null
	}));

	return { count: chapterList.length, chapters: chapterList };
}

export async function getChapterById(adventureName, chapterId) {
	const normalizedChapterId = requireString(chapterId, 'chapterId');
	const adventure = await readAdventureJson(adventureName);
	const chapters = ensureArrayField(adventure, 'chapters');

	const chapter = chapters.find((item) => item && String(item.id) === normalizedChapterId);
	if (!chapter) {
		const err = new Error('Chapter not found');
		err.status = 404;
		throw err;
	}

	return { chapter };
}

export async function getNpcs(adventureName) {
	const adventure = await readAdventureJson(adventureName);
	const npcs = ensureArrayField(adventure, 'npcs');

	const npcList = npcs.map((npc) => ({
		id: npc?.id ?? null,
		name: npc?.name ?? null
	}));

	return { count: npcList.length, npcs: npcList };
}

export async function getNpcById(adventureName, npcId) {
	const normalizedNpcId = requireString(npcId, 'npcId');
	const adventure = await readAdventureJson(adventureName);
	const npcs = ensureArrayField(adventure, 'npcs');

	const npc = npcs.find((item) => item && String(item.id) === normalizedNpcId);
	if (!npc) {
		const err = new Error('NPC not found');
		err.status = 404;
		throw err;
	}

	return { npc };
}
