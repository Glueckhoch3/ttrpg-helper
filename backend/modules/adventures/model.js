import fs from 'node:fs/promises';
import path from 'node:path';
import sanitize from 'sanitize-filename';
import { UPLOAD_DIR } from '../../config/index.js';

function normalizeAdventureName(adventureName) {
	if (!adventureName || String(adventureName).trim().length === 0) {
		throw Object.assign(new Error('adventureName is required'), { status: 400 });
	}

	const raw = String(adventureName).trim();
	const withoutExtension = raw.toLowerCase().endsWith('.json') ? raw.slice(0, -5) : raw;
	const safeBaseName = sanitize(path.basename(withoutExtension));

	if (!safeBaseName || safeBaseName.length === 0) {
		throw Object.assign(new Error('Invalid adventureName after sanitization'), { status: 400 });
	}

	return `${safeBaseName}.json`;
}

export async function readAdventureJson(adventureName) {
	const filename = normalizeAdventureName(adventureName);
	const destPath = path.resolve(UPLOAD_DIR, path.basename(filename));

	let data;
	try {
		data = await fs.readFile(destPath, 'utf8');
	} catch (e) {
		if (e?.code === 'ENOENT') {
			const err = new Error('Adventure not found');
			err.status = 404;
			throw err;
		}
		throw e;
	}

	let parsed;
	try {
		parsed = JSON.parse(data);
	} catch (e) {
		const err = new Error('Stored adventure JSON is invalid');
		err.status = 422;
		throw err;
	}

	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		const err = new Error('Adventure root must be an object');
		err.status = 422;
		throw err;
	}

	return parsed;
}
