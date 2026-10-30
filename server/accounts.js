'use strict';
/* =====================================================================
   Arena 151 accounts: sign in with email + password, and a cloud save.
   Storage: SQLite (Node 22's built-in node:sqlite) in DATA_DIR/arena151.db,
   kept on a Docker volume so it survives rebuilds.
   - users:    email (unique, lower-case), scrypt password hash + per-user salt
   - sessions: random tokens, stored only as SHA-256 hashes, expire after 60 days
   - saves:    one JSON blob per user: every "arena151.*" setting and save
               (story slots + Pokédex, game save slots, settings, AI levels …)
   API (JSON):
     POST /api/register {email, password}  → {token, email}
     POST /api/login    {email, password}  → {token, email}
     POST /api/logout                      (Authorization: Bearer <token>)
     GET  /api/me                          → {email, created, savedAt}
     GET  /api/save                        → {data, savedAt}
     PUT  /api/save     {data}             → {savedAt}
   Limits: sign-in attempts per address and per email; saves up to 4 MB.
   ===================================================================== */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'arena151.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    pass_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created INTEGER NOT NULL,
    last_login INTEGER
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created INTEGER NOT NULL,
    expires INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS saves (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    saved_at INTEGER NOT NULL,
    app_version TEXT
  );
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
  -- ranked play: a player is an account ('u:<id>') or a phone ('d:<hash of its private device key>')
  CREATE TABLE IF NOT EXISTS rplayers (pkey TEXT PRIMARY KEY, name TEXT NOT NULL, rating REAL NOT NULL DEFAULT 1000, wins INTEGER NOT NULL DEFAULT 0, losses INTEGER NOT NULL DEFAULT 0, draws INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS rmatches (id INTEGER PRIMARY KEY AUTOINCREMENT, a TEXT NOT NULL, b TEXT NOT NULL, winner TEXT NOT NULL, a_before REAL, b_before REAL, a_after REAL, b_after REAL, at INTEGER NOT NULL);
  -- ghost battles: teams seen in real online battles (trainer and team only — no names or emails)
  CREATE TABLE IF NOT EXISTS ghosts (id INTEGER PRIMARY KEY AUTOINCREMENT, trainer TEXT NOT NULL, team TEXT NOT NULL, at INTEGER NOT NULL);
`);
const q = {
  userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  insertUser: db.prepare('INSERT INTO users (email, pass_hash, salt, created) VALUES (?, ?, ?, ?)'),
  touchLogin: db.prepare('UPDATE users SET last_login = ? WHERE id = ?'),
  insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, created, expires) VALUES (?, ?, ?, ?)'),
  session: db.prepare('SELECT s.user_id, s.expires, u.email, u.created FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  purgeSessions: db.prepare('DELETE FROM sessions WHERE expires < ?'),
  getSave: db.prepare('SELECT data, saved_at FROM saves WHERE user_id = ?'),
  putSave: db.prepare('INSERT INTO saves (user_id, data, saved_at, app_version) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, saved_at = excluded.saved_at, app_version = excluded.app_version'),
  userCount: db.prepare('SELECT COUNT(*) AS n FROM users'),
  rGet: db.prepare('SELECT * FROM rplayers WHERE pkey = ?'),
  rNew: db.prepare('INSERT OR IGNORE INTO rplayers (pkey, name, updated) VALUES (?, ?, ?)'),
  rName: db.prepare('UPDATE rplayers SET name = ? WHERE pkey = ?'),
  rSet: db.prepare('UPDATE rplayers SET rating = ?, wins = wins + ?, losses = losses + ?, draws = draws + ?, updated = ? WHERE pkey = ?'),
  rTop: db.prepare('SELECT name, rating, wins, losses, draws FROM rplayers WHERE wins + losses + draws > 0 ORDER BY rating DESC LIMIT ?'),
  rRank: db.prepare('SELECT COUNT(*) AS n FROM rplayers WHERE rating > ? AND wins + losses + draws > 0'),
  mAdd: db.prepare('INSERT INTO rmatches (a, b, winner, a_before, b_before, a_after, b_after, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'),
  gAdd: db.prepare('INSERT INTO ghosts (trainer, team, at) VALUES (?, ?, ?)'),
  gTrim: db.prepare('DELETE FROM ghosts WHERE id NOT IN (SELECT id FROM ghosts ORDER BY id DESC LIMIT 500)'),
  gRandom: db.prepare('SELECT trainer, team FROM ghosts ORDER BY RANDOM() LIMIT 1'),
  gCount: db.prepare('SELECT COUNT(*) AS n FROM ghosts')
};
const SESSION_MS = 60 * 24 * 3600 * 1000, MAX_SAVE = 4 * 1024 * 1024;
setInterval(() => { try { q.purgeSessions.run(Date.now()); } catch (e) { } }, 3600 * 1000).unref();

/* ---------- passwords and tokens ---------- */
const scrypt = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => e ? rej(e) : res(k)));
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
async function hashPassword(pw) { const salt = crypto.randomBytes(16).toString('hex'); return { salt, hash: (await scrypt(pw, salt)).toString('hex') }; }
async function checkPassword(pw, salt, hash) { const k = await scrypt(pw, salt), h = Buffer.from(hash, 'hex'); return h.length === k.length && crypto.timingSafeEqual(h, k); }
function newSession(userId) { const token = crypto.randomBytes(32).toString('base64url'), now = Date.now(); q.insertSession.run(sha256(token), userId, now, now + SESSION_MS); return token; }
function authed(req) {
  const m = /^Bearer\s+([A-Za-z0-9_-]{20,100})$/.exec(req.headers.authorization || ''); if (!m) return null;
  const s = q.session.get(sha256(m[1])); if (!s || s.expires < Date.now()) return null;
  return { id: s.user_id, email: s.email, created: s.created, token: m[1] };
}
const validEmail = e => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const validPassword = p => typeof p === 'string' && p.length >= 8 && p.length <= 200;

/* ---------- limits on sign-in attempts ---------- */
const attempts = new Map();                                   // key → [timestamps]
function limited(key, max, windowMs) {
  const now = Date.now(), list = (attempts.get(key) || []).filter(t => now - t < windowMs);
  list.push(now); attempts.set(key, list); return list.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of attempts) if (!v.some(t => now - t < 3600 * 1000)) attempts.delete(k); }, 600 * 1000).unref();

/* ---------- HTTP plumbing ---------- */
function send(res, status, body) {
  const s = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS' });
  res.end(s);
}
function readBody(req, limit) {
  return new Promise((res, rej) => {
    let n = 0; const chunks = [];
    req.on('data', c => { n += c.length; if (n > limit) { rej(Object.assign(new Error('too large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { res(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { rej(Object.assign(new Error('bad json'), { code: 400 })); } });
    req.on('error', rej);
  });
}
const clientIp = req => (process.env.TRUST_PROXY && (req.headers['x-real-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0].trim())) || req.socket.remoteAddress || '?';
// Only "arena151.*" keys with string values; never the sign-in token itself.
function cleanSave(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const out = {};
  for (const [k, v] of Object.entries(data)) if (typeof k === 'string' && k.startsWith('arena151.') && k.length <= 120 && typeof v === 'string' && !/^arena151\.(auth|guest|cloud)/.test(k)) out[k] = v;
  return out;
}

/* ---------- ranked play ---------- */
const validKey = k => typeof k === 'string' && /^[A-Za-z0-9_-]{32,100}$/.test(k);
function playerKey(token, deviceKey) {                       // an account if signed in, otherwise this phone
  if (typeof token === 'string' && /^[A-Za-z0-9_-]{20,100}$/.test(token)) { const s = q.session.get(sha256(token)); if (s && s.expires >= Date.now()) return { key: 'u:' + s.user_id, userId: s.user_id }; }
  if (validKey(deviceKey)) return { key: 'd:' + sha256(deviceKey), userId: null };
  return null;
}
function campaignBeaten(p, claim) {                          // accounts: checked against the synced save; phones: their own report
  if (!p.userId) return !!claim;
  const s = q.getSave.get(p.userId); if (!s) return false;
  try { const d = JSON.parse(s.data); return Object.keys(d).some(k => { if (!/^arena151\.story\.\d$/.test(k)) return false; try { const v = JSON.parse(d[k]); return !!(v && (v.finishedAt || v.badges >= 10)); } catch (e) { return false; } }); } catch (e) { return false; }
}
function ratedPlayer(key, name) { const now = Date.now(); q.rNew.run(key, String(name || 'Trainer').slice(0, 24), now); if (name) q.rName.run(String(name).slice(0, 24), key); const r = q.rGet.get(key); return { ...r, rank: q.rRank.get(r.rating).n + 1 }; }
function recordRanked(ka, kb, winner) {                      // Elo, K = 32; winner 'A', 'B' or 'draw'
  const a = q.rGet.get(ka), b = q.rGet.get(kb); if (!a || !b) return null;
  const ea = 1 / (1 + 10 ** ((b.rating - a.rating) / 400)), sa = winner === 'A' ? 1 : winner === 'B' ? 0 : .5, K = 32;
  const na = Math.round((a.rating + K * (sa - ea)) * 10) / 10, nb = Math.round((b.rating + K * ((1 - sa) - (1 - ea))) * 10) / 10, now = Date.now();
  q.rSet.run(na, sa === 1 ? 1 : 0, sa === 0 ? 1 : 0, sa === .5 ? 1 : 0, now, ka); q.rSet.run(nb, sa === 0 ? 1 : 0, sa === 1 ? 1 : 0, sa === .5 ? 1 : 0, now, kb);
  q.mAdd.run(ka, kb, winner, a.rating, b.rating, na, nb, now);
  return { A: { before: a.rating, after: na }, B: { before: b.rating, after: nb } };
}
function addGhost(trainer, team) { try { if (!Array.isArray(team) || !team.length) return; q.gAdd.run(String(trainer || 'Trainer').slice(0, 40).replace(/[^A-Za-z0-9_ .-]/g, ''), JSON.stringify(team.slice(0, 6).map(t => String(t).slice(0, 24))), Date.now()); q.gTrim.run(); } catch (e) { } }

/* ---------- the API ---------- */
async function handle(req, res, appVersion) {
  const url = req.url.split('?')[0];
  if (req.method === 'OPTIONS') return send(res, 204, {});
  try {
    // public: the ranked leaderboard, a random ghost team, and a player's own rating (account or phone key)
    if (req.method === 'GET' && url === '/api/ranked/top') return send(res, 200, { top: q.rTop.all(10).map(r => ({ ...r, rating: Math.round(r.rating) })) });
    if (req.method === 'GET' && url === '/api/ghost') { const g = q.gRandom.get(); return send(res, 200, g ? { trainer: g.trainer, team: JSON.parse(g.team), pool: q.gCount.get().n } : { trainer: null, team: null, pool: 0 }); }
    if (req.method === 'POST' && url === '/api/ranked/me') {
      const b = await readBody(req, 4096), tm = /^Bearer\s+(\S+)$/.exec(req.headers.authorization || ''), p = playerKey(tm && tm[1], b.deviceKey);
      if (!p) return send(res, 400, { error: 'No player key.' });
      const r = ratedPlayer(p.key, b.name), ok = campaignBeaten(p, b.finished);
      return send(res, 200, { rating: Math.round(r.rating), wins: r.wins, losses: r.losses, draws: r.draws, rank: r.rank, eligible: ok, account: !!p.userId });
    }
    if (req.method === 'POST' && (url === '/api/register' || url === '/api/login')) {
      const ip = clientIp(req);
      if (limited('ip:' + ip, 30, 10 * 60 * 1000)) return send(res, 429, { error: 'Too many attempts from your network. Please wait a few minutes.' });
      const b = await readBody(req, 10 * 1024), email = String(b.email || '').trim().toLowerCase(), password = b.password;
      if (!validEmail(email)) return send(res, 400, { error: 'Please enter a valid email address.' });
      if (!validPassword(password)) return send(res, 400, { error: 'Passwords need at least 8 characters.' });
      if (url === '/api/register') {
        if (q.userByEmail.get(email)) return send(res, 409, { error: 'An account with this email already exists. Sign in instead.' });
        const { salt, hash } = await hashPassword(password), r = q.insertUser.run(email, hash, salt, Date.now());
        const id = Number(r.lastInsertRowid); q.touchLogin.run(Date.now(), id);
        console.log(new Date().toISOString().slice(11, 19), 'account created');
        return send(res, 201, { token: newSession(id), email });
      }
      if (limited('email:' + email, 10, 15 * 60 * 1000)) return send(res, 429, { error: 'Too many sign-in attempts for this account. Please wait 15 minutes.' });
      const u = q.userByEmail.get(email);
      if (!u || !(await checkPassword(password, u.salt, u.pass_hash))) return send(res, 401, { error: 'Wrong email or password.' });
      q.touchLogin.run(Date.now(), u.id);
      return send(res, 200, { token: newSession(u.id), email });
    }
    const me = authed(req);
    if (!me) return send(res, 401, { error: 'Please sign in again.' });
    if (req.method === 'POST' && url === '/api/logout') { q.deleteSession.run(sha256(me.token)); return send(res, 200, { ok: true }); }
    if (req.method === 'GET' && url === '/api/me') { const s = q.getSave.get(me.id); return send(res, 200, { email: me.email, created: me.created, savedAt: s ? s.saved_at : null }); }
    if (req.method === 'GET' && url === '/api/save') { const s = q.getSave.get(me.id); return send(res, 200, { data: s ? JSON.parse(s.data) : null, savedAt: s ? s.saved_at : null }); }
    if (req.method === 'PUT' && url === '/api/save') {
      const b = await readBody(req, MAX_SAVE + 1024), data = cleanSave(b.data);
      if (!data) return send(res, 400, { error: 'That is not a save.' });
      const text = JSON.stringify(data); if (text.length > MAX_SAVE) return send(res, 413, { error: 'Save too large.' });
      const at = Date.now(); q.putSave.run(me.id, text, at, String(b.version || appVersion || '').slice(0, 20));
      return send(res, 200, { savedAt: at });
    }
    return send(res, 404, { error: 'Not found.' });
  } catch (e) {
    if (e.code === 413) return send(res, 413, { error: 'Too large.' });
    if (e.code === 400) return send(res, 400, { error: 'Bad request.' });
    console.error('accounts error', e && e.message);
    return send(res, 500, { error: 'Something went wrong. Please try again.' });
  }
}
module.exports = { handle, userCount: () => q.userCount.get().n, playerKey, campaignBeaten, ratedPlayer, recordRanked, addGhost };
