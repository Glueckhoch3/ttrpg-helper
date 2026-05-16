import express from 'express';
import { upload } from './controller.js';

const router = express.Router();

// POST /api/save - accept whole JSON body and optional ?filename=...
router.post('/', upload);

export default router;
