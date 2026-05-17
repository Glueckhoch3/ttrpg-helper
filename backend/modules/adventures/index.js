import express from 'express';
import {
	getAdventuresOverview,
	getMetadata,
	getChapters,
	getChapterById,
	getNpcs,
	getNpcById
} from './controller.js';

const router = express.Router();

router.get('/', getAdventuresOverview);
router.get('/:adventureFile/metadata', getMetadata);
router.get('/:adventureFile/chapters', getChapters);
router.get('/:adventureFile/chapters/:chapterId', getChapterById);
router.get('/:adventureFile/npcs', getNpcs);
router.get('/:adventureFile/npcs/:npcId', getNpcById);

export default router;
