import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import saveRouter from './modules/savejson/index.js';
import loadRouter from './modules/loadjson/index.js';
import adventuresRouter from './modules/adventures/index.js';
import { BODY_LIMIT } from './config/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: BODY_LIMIT }));

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Importer: accept whole JSON files as application/json
app.use('/api/save', saveRouter);

// Export: serve saved JSON by filename via query `?filename=`
app.use('/api/load', loadRouter);

// Adventures: read adventure slices and overview by filename stem
app.use('/api/adventures', adventuresRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler
app.use(errorHandler);

export default app;
