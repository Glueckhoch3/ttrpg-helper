import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(import.meta.dirname, '.env'), quiet: true });
const env = process.env;
export const PORT = Number(env.PORT) || 3000;
export const HOST = env.HOST || '0.0.0.0';
export const DATA_DIR = path.resolve(import.meta.dirname, env.DATA_DIR || './data');
export const GM_PIN = env.GM_PIN || '';
export const GROUP_PASSWORD = env.GROUP_PASSWORD || '';
