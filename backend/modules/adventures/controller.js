import * as service from './service.js';

export async function getAdventuresOverview(req, res, next) {
	try {
		const result = await service.getAdventuresOverview();
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function getMetadata(req, res, next) {
	try {
		const { adventureFile } = req.params;
		const result = await service.getMetadata(adventureFile);
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function getChapters(req, res, next) {
	try {
		const { adventureFile } = req.params;
		const result = await service.getChapters(adventureFile);
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function getChapterById(req, res, next) {
	try {
		const { adventureFile, chapterId } = req.params;
		const result = await service.getChapterById(adventureFile, chapterId);
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function getNpcs(req, res, next) {
	try {
		const { adventureFile } = req.params;
		const result = await service.getNpcs(adventureFile);
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function getNpcById(req, res, next) {
	try {
		const { adventureFile, npcId } = req.params;
		const result = await service.getNpcById(adventureFile, npcId);
		res.json(result);
	} catch (err) {
		next(err);
	}
}
