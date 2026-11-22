import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import { createHub } from './lib/events.js';
import { createAuth } from './lib/auth.js';
import { HttpError, bad } from './lib/util.js';
import sessionsRoutes from './routes/sessions.js';
import storyRoutes from './routes/story.js';
import mapsRoutes from './routes/maps.js';
import npcRoutes from './routes/npcs.js';

/** createApp({ db, gmPin, filesDir, staticDir }) – used by server.js and tests. */
export function createApp({ db, gmPin, groupPassword, filesDir, staticDir }) {
  fs.mkdirSync(filesDir, { recursive: true });
  const app = express();
  const hub = createHub();
  const auth = createAuth(db, { gmPin, groupPassword });
  const ctx = { db, hub, auth, filesDir };

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' }, hsts: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  const api = express.Router();
  api.get('/health', (req, res) => res.json({ status: 'ok' }));
  api.post('/auth/join', (req, res) => {
    const cookie = auth.joinCookie(req.body?.password);
    if (!cookie) throw new HttpError(401, 'Wrong group password');
    res.set('Set-Cookie', cookie).json({ member: true });
  });
  api.post('/auth/leave', (req, res) => res.set('Set-Cookie', auth.leaveCookie).json({ member: false }));
  api.get('/auth/me', (req, res) => res.json({ member: auth.isMember(req), gm: auth.isGm(req) }));
  api.post('/auth/gm', auth.requireMember, (req, res) => {
    const token = auth.gmLogin(req.body?.pin);
    if (!token) throw new HttpError(401, 'Wrong PIN');
    res.json({ token });
  });
  // Everything below needs the group password (or GM token)
  api.use(auth.requireMember);
  api.get('/events', hub.handler);
  api.use(sessionsRoutes(ctx));
  api.use(storyRoutes(ctx));
  api.use(npcRoutes(ctx));
  api.use(mapsRoutes(ctx));
  api.get('/files/:name', (req, res) => {
    const name = req.params.name;
    if (!/^[\w-]+\.(png|jpg|webp|pdf)$/.test(name)) throw bad('Invalid file name');
    const hidden = db.prepare('SELECT 1 FROM maps WHERE image_file=? AND unlocked=0').get(name);
    if (hidden && !auth.isGm(req)) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.resolve(filesDir, name), (err) => { if (err && !res.headersSent) res.status(404).json({ error: 'Not found' }); });
  });
  api.use((req, res) => res.status(404).json({ error: 'Not Found' }));
  app.use('/api', api);

  if (staticDir && fs.existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.resolve(staticDir, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  });
  app.locals.hub = hub;
  return app;
}
