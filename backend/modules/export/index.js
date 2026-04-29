import express from 'express';
import { download } from './controller.js';

const router = express.Router();

// GET /api/export?filename=...
router.get('/', download);

export default router;
