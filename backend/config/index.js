import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = process.env;

export const PORT = env.PORT || 3000;
export const BODY_LIMIT = env.BODY_LIMIT || '5mb';
export const UPLOAD_DIR = env.UPLOAD_DIR || './uploads';
export const ALLOW_OVERWRITE = (env.ALLOW_OVERWRITE || 'false') === 'true';
export const LOG_LEVEL = env.LOG_LEVEL || 'info';
