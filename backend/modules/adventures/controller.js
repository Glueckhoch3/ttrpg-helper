import * as service from './service.js';

export async function getMetadata(req, res, next) {
	try {
		const { adventureName } = req.params;
		const result = await service.getMetadata(adventureName);
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function getChapters(req, res, next) {
	try {
		const { adventureName } = req.params;
		const result = await service.getChapters(adventureName);
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function getChapterById(req, res, next) {
	try {
		const { adventureName, chapterId } = req.params;
		const result = await service.getChapterById(adventureName, chapterId);
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function getNpcs(req, res, next) {
	try {
		const { adventureName } = req.params;
		const result = await service.getNpcs(adventureName);
		res.json(result);
	} catch (err) {
		next(err);
	}
}

export async function getNpcById(req, res, next) {
	try {
		const { adventureName, npcId } = req.params;
		const result = await service.getNpcById(adventureName, npcId);
		res.json(result);
	} catch (err) {
		next(err);
	}
}
