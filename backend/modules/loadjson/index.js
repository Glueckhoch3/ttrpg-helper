import express from 'express';
import { download } from './controller.js';

const router = express.Router();

// GET /api/load?filename=...
router.get('/', download);

export default router;
