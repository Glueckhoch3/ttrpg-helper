import fs from 'node:fs/promises';
import path from 'node:path';
import sanitize from 'sanitize-filename';
import { UPLOAD_DIR } from '../../config/index.js';

function normalizeAdventureFilenameStem(adventureFile) {
	if (!adventureFile || String(adventureFile).trim().length === 0) {
		throw Object.assign(new Error('adventure filename is required'), { status: 400 });
	}

	const stem = String(adventureFile).trim();
	if (stem.toLowerCase().endsWith('.json')) {
		throw Object.assign(new Error('adventure filename must not include .json'), { status: 400 });
	}

	const sanitizedStem = sanitize(stem);
	if (!sanitizedStem || sanitizedStem.length === 0) {
		throw Object.assign(new Error('adventure filename is invalid'), { status: 400 });
	}

	if (path.basename(sanitizedStem) !== sanitizedStem || sanitizedStem.includes('..')) {
		throw Object.assign(new Error('adventure filename is invalid'), { status: 400 });
	}

	return sanitizedStem;
}

function normalizeMetadata(parsed) {
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		return null;
	}
	if (!parsed.metadata || typeof parsed.metadata !== 'object' || Array.isArray(parsed.metadata)) {
		return null;
	}
	return parsed.metadata;
}

export async function readAdventureJson(adventureFile) {
	const stem = normalizeAdventureFilenameStem(adventureFile);
	const filePath = path.resolve(UPLOAD_DIR, `${path.basename(stem)}.json`);
	try {
		const data = await fs.readFile(filePath, 'utf8');
		return JSON.parse(data);
	} catch (e) {
		if (e?.code === 'ENOENT') {
			const err = new Error('Adventure not found');
			err.status = 404;
			throw err;
		}
		if (e instanceof SyntaxError) {
			const err = new Error('Adventure data malformed');
			err.status = 422;
			throw err;
		}
		throw e;
	}
}

export async function listAdventureMetadata() {
	try {
		const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });
		const jsonFiles = entries
			.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
			.map((entry) => entry.name)
			.sort((a, b) => a.localeCompare(b));

		const metadataList = [];

		for (const fileName of jsonFiles) {
			const filePath = path.resolve(UPLOAD_DIR, path.basename(fileName));
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

			const metadata = normalizeMetadata(parsed);
			if (!metadata) {
				continue;
			}

			metadataList.push(metadata);
		}

		return metadataList;
	} catch (e) {
		if (e?.code === 'ENOENT') {
			return [];
		}
		throw e;
	}
}
