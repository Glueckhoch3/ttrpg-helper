import fs from 'node:fs/promises';
import path from 'node:path';
import { UPLOAD_DIR } from '../../config/index.js';

function normalizeAdventureName(adventureName) {
	if (!adventureName || String(adventureName).trim().length === 0) {
		throw Object.assign(new Error('adventureName is required'), { status: 400 });
	}
	return String(adventureName).trim();
}

export async function readAdventureJson(adventureName) {
	const wantedTitle = normalizeAdventureName(adventureName);

	try {
		const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
		const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'));

		for (const entry of jsonFiles) {
			const filePath = path.resolve(UPLOAD_DIR, path.basename(entry.name));
			let data;
			try {
				data = await fs.readFile(filePath, 'utf8');
			} catch {
				continue;
			}

			let parsed;
			try {
				parsed = JSON.parse(data);
			} catch {
				continue;
			}

			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				continue;
			}

			const title = parsed?.metadata?.title;
			if (typeof title === 'string' && title.trim() === wantedTitle) {
				return parsed;
			}
		}
	} catch (e) {
		if (e?.code === 'ENOENT') {
			const err = new Error('Adventure not found');
			err.status = 404;
			throw err;
		}
		throw e;
	}

	const err = new Error('Adventure not found');
	err.status = 404;
	throw err;
}
