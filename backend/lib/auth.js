import crypto from 'node:crypto';
import { HttpError, safeEqual } from './util.js';

const COOKIE = 'ttrpg_member';
const readCookie = (req, name) => {
  const m = (req.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
};

// Two credentials, both HMACs of a secret persisted in the DB (survive restarts):
//  - member cookie (HttpOnly, set after the group password; also works for <img> and EventSource)
//  - GM bearer token (after the GM PIN)
export function createAuth(db, { gmPin, groupPassword }) {
  let row = db.prepare("SELECT value FROM settings WHERE key='secret'").get();
  if (!row) {
    row = { value: crypto.randomBytes(32).toString('hex') };
    db.prepare("INSERT INTO settings(key,value) VALUES('secret',?)").run(row.value);
  }
  const mac = (label) => crypto.createHmac('sha256', row.value).update(label).digest('hex');
  const gmToken = mac('gm');
  const memberToken = mac('member');
  const isGm = (req) => {
    const h = req.get('authorization') || '';
    return h.startsWith('Bearer ') && safeEqual(h.slice(7), gmToken);
  };
  const isMember = (req) => isGm(req) || safeEqual(readCookie(req, COOKIE), memberToken);
  return {
    isGm,
    isMember,
    joinCookie: (password) => (typeof password === 'string' && safeEqual(password, groupPassword)
      ? `${COOKIE}=${memberToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 90}` : null),
    leaveCookie: `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    gmLogin: (pin) => (typeof pin === 'string' && safeEqual(pin, gmPin) ? gmToken : null),
    requireMember(req, res, next) {
      if (!isMember(req)) return next(new HttpError(401, 'Group password required'));
      next();
    },
    requireGm(req, res, next) {
      if (!isGm(req)) return next(new HttpError(403, 'GM access required'));
      next();
    },
  };
}
