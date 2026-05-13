import express from 'express';
import {
	getMetadata,
	getChapters,
	getChapterById,
	getNpcs,
	getNpcById
} from './controller.js';

const router = express.Router();

router.get('/:adventureName/metadata', getMetadata);
router.get('/:adventureName/chapters', getChapters);
router.get('/:adventureName/chapters/:chapterId', getChapterById);
router.get('/:adventureName/npcs', getNpcs);
router.get('/:adventureName/npcs/:npcId', getNpcById);

export default router;
